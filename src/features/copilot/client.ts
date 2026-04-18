import { backendClient } from "@/api";
import { ApiHttpError } from "@/api/generated/backend-client";
import type { AIDevRequest, AIDevResponse, IDEFeedbackRequest } from "@/api";
import type { CopilotMode, CopilotRunSummary, CopilotStructuredOutput, EndpointHealth } from "./types";
import { copilotTelemetry } from "./telemetry";

export class CopilotApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly remediation?: string,
  ) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mapError = (error: unknown): CopilotApiError => {
  if (error instanceof CopilotApiError) return error;

  if (error instanceof ApiHttpError) {
    const baseMessage = error.status === 403 ? "Sessione non autorizzata" : error.message;
    return new CopilotApiError(baseMessage, error.status, error.remediation ?? "Controlla i log backend e la connettività API.");
  }

  const message = error instanceof Error ? error.message : "Unknown Copilot error";

  if (message.includes("403")) {
    return new CopilotApiError("Sessione non autorizzata", 403, "Riesegui login o aggiorna il token CSRF.");
  }

  if (message.includes("429") || message.includes("503")) {
    return new CopilotApiError("Servizio temporaneamente non disponibile", undefined, "Riprova tra pochi secondi.");
  }

  return new CopilotApiError(message, undefined, "Controlla i log backend e la connettività API.");
};

const maybeRetryCsrf = async <T>(action: () => Promise<T>) => {
  try {
    return await action();
  } catch (error) {
    const mapped = mapError(error);
    if (mapped.status === 403 || mapped.message.toLowerCase().includes("csrf")) {
      await backendClient.call("session_me_v1_auth_session_me_get");
      return action();
    }
    throw mapped;
  }
};

const withRetry = async <T>(action: () => Promise<T>, maxRetries = 2): Promise<T> => {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await action();
    } catch (error) {
      attempt += 1;
      if (attempt > maxRetries) throw mapError(error);
      await sleep(150 * 2 ** attempt);
    }
  }
};


const timed = async <T>(operation: string, action: () => Promise<T>): Promise<T> => {
  const startedAt = performance.now();
  try {
    const result = await action();
    copilotTelemetry.trackCall(operation, performance.now() - startedAt, true);
    return result;
  } catch (error) {
    copilotTelemetry.trackCall(operation, performance.now() - startedAt, false);
    throw error;
  }
};

const normalizeOutput = (result: AIDevResponse | Record<string, unknown>): CopilotStructuredOutput => {
  const architecture = "architecture_analysis" in result ? result.architecture_analysis : {};
  const summary =
    (architecture as Record<string, unknown>)?.summary?.toString() ??
    ("task" in result ? `Run completata per task: ${String(result.task)}` : "Analisi completata");

  const risks =
    (("final_review" in result ? (result.final_review as Record<string, unknown>)?.risks : []) as string[]) ?? [];

  const nextSteps =
    (("plan" in result ? result.plan : []) as string[])?.slice(0, 4) ?? ["Rivedi il diff prima di applicare la patch"];

  return {
    executiveSummary: summary,
    bulletPoints: [
      `Mode: ${"mode" in result ? String(result.mode) : "n/a"}`,
      `Candidate files: ${"candidate_files" in result ? result.candidate_files.length : 0}`,
      `Run id: ${"run_id" in result ? String(result.run_id) : "n/a"}`,
    ],
    risks: risks.length > 0 ? risks : ["Validare patch e testare localmente prima del commit."],
    nextSteps,
    raw: result,
  };
};

export const copilotClient = {
  async runSync(payload: Pick<AIDevRequest, "task" | "repo" | "mode" | "commit_message" | "human_approved">) {
    return timed("ai-dev.sync", async () => {
      const result = await withRetry(() => maybeRetryCsrf(() => backendClient.call("ai_dev_v1_v1_ai_dev_post", { body: payload })));
      copilotTelemetry.trackFunnelStep("analyze");
      if (payload.mode === "dry_run") copilotTelemetry.trackFunnelStep("patch_generated");
      if (payload.mode === "apply_patch") copilotTelemetry.trackFunnelStep("patch_applied");
      if (payload.mode === "commit") copilotTelemetry.trackFunnelStep("commit");
      return result;
    });
  },

  async runAsync(payload: Pick<AIDevRequest, "task" | "repo" | "mode" | "commit_message" | "human_approved">) {
    return timed("ai-dev.async", async () => {
      const result = await withRetry(() => maybeRetryCsrf(() => backendClient.call("ai_dev_async_v1_ai_dev_async_post", { body: payload })));
      copilotTelemetry.trackFunnelStep("analyze");
      return result;
    });
  },

  async listRuns(limit = 10) {
    return timed("runs.list", () => withRetry(() => backendClient.call("list_runs_v1_runs_get", { query: { limit } })));
  },

  async getRun(runId: string) {
    return timed("runs.get", () => withRetry(() => backendClient.call("get_run_v1_runs__run_id__get", { pathParams: { run_id: runId } })));
  },

  async getRunResult(runId: string) {
    return timed("runs.result", () => withRetry(() => backendClient.call("get_run_result_v1_runs__run_id__result_get", { pathParams: { run_id: runId } })));
  },

  async getRunEvents(runId: string) {
    return timed("runs.events", () => withRetry(() => backendClient.call("run_events_v1_runs__run_id__events_get", { pathParams: { run_id: runId } })));
  },

  async getEndpointHealth(): Promise<EndpointHealth> {
    const [ollama, qdrant, temporal] = await Promise.allSettled([
      backendClient.call("ollama_status_v1_system_ollama_status_get"),
      backendClient.call("qdrant_status_v1_system_qdrant_status_get"),
      backendClient.call("temporal_status_v1_system_temporal_status_get"),
    ]);

    const state = (result: PromiseSettledResult<Record<string, unknown>>): "online" | "offline" =>
      result.status === "fulfilled" ? "online" : "offline";

    return {
      ollama: state(ollama as PromiseSettledResult<Record<string, unknown>>),
      qdrant: state(qdrant as PromiseSettledResult<Record<string, unknown>>),
      temporal: state(temporal as PromiseSettledResult<Record<string, unknown>>),
    };
  },

  async getEntrypointFeedback() {
    return timed("feedback.metrics", () => withRetry(() => backendClient.call("ide_analytics_v1_ide_analytics_get")));
  },

  async sendEntrypointFeedback(payload: IDEFeedbackRequest) {
    return timed("feedback.submit", () => withRetry(() => maybeRetryCsrf(() => backendClient.call("ide_feedback_v1_ide_feedback_post", { body: payload }))));
  },

  toStructuredOutput: normalizeOutput,

  getTelemetrySnapshot() {
    return copilotTelemetry.getSnapshot();
  },

  toRunSummary(result: Record<string, unknown>, fallbackMode: CopilotMode = "analyze"): CopilotRunSummary {
    return {
      runId: String(result.run_id ?? "unknown"),
      state: (result.state as CopilotRunSummary["state"]) ?? "queued",
      mode: (result.mode as CopilotMode) ?? fallbackMode,
      startedAt: String(result.created_at ?? new Date().toISOString()),
      endedAt: typeof result.ended_at === "string" ? result.ended_at : undefined,
      error: typeof result.error === "string" ? result.error : undefined,
    };
  },
};
