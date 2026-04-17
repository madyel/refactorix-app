import { useCallback, useMemo, useReducer } from "react";
import { copilotClient } from "./client";
import { canRunMode, isHighRiskMode } from "./rbac";
import { COPILOT_DEFAULTS } from "./constants";
import type {
  AuditEvent,
  CopilotMode,
  CopilotRunSummary,
  CopilotStructuredOutput,
  EndpointHealth,
  ParsedHunk,
  SessionRole,
} from "./types";

type CopilotMachineState = "idle" | "submitting" | "streaming" | "completed" | "failed";

interface CopilotState {
  machineState: CopilotMachineState;
  mode: CopilotMode;
  task: string;
  repo: string;
  role: SessionRole;
  currentRunId?: string;
  output?: CopilotStructuredOutput;
  runs: CopilotRunSummary[];
  hunks: ParsedHunk[];
  endpointHealth: EndpointHealth;
  feedbackKpi?: Record<string, unknown>;
  error?: string;
  auditTrail: AuditEvent[];
}

type CopilotAction =
  | { type: "SET_FIELD"; field: "task" | "repo" | "mode" | "role"; value: string }
  | { type: "SUBMIT" }
  | { type: "STREAMING"; runId: string }
  | { type: "SUCCESS"; output: CopilotStructuredOutput; run?: CopilotRunSummary }
  | { type: "SET_RUNS"; runs: CopilotRunSummary[] }
  | { type: "SET_HUNKS"; hunks: ParsedHunk[] }
  | { type: "TOGGLE_HUNK"; id: string; accepted: boolean }
  | { type: "SET_HEALTH"; health: EndpointHealth }
  | { type: "SET_KPI"; kpi: Record<string, unknown> }
  | { type: "ERROR"; error: string }
  | { type: "AUDIT"; event: AuditEvent };

const defaultState: CopilotState = {
  machineState: "idle",
  mode: "analyze",
  task: "",
  repo: COPILOT_DEFAULTS.repo,
  role: COPILOT_DEFAULTS.role,
  runs: [],
  hunks: [],
  endpointHealth: { ollama: "unknown", qdrant: "unknown", temporal: "unknown" },
  auditTrail: [],
};

const parseDiffHunks = (patch: string): ParsedHunk[] => {
  const lines = patch.split("\n");
  const hunks: ParsedHunk[] = [];
  let currentHeader = "";
  let currentBody: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith("@@")) {
      if (currentHeader) {
        hunks.push({
          id: `${currentHeader}-${hunks.length}`,
          header: currentHeader,
          body: currentBody.join("\n"),
          accepted: true,
        });
      }
      currentHeader = line;
      currentBody = [];
      return;
    }
    if (currentHeader) {
      currentBody.push(line);
    }
  });

  if (currentHeader) {
    hunks.push({
      id: `${currentHeader}-${hunks.length}`,
      header: currentHeader,
      body: currentBody.join("\n"),
      accepted: true,
    });
  }

  return hunks;
};

const reducer = (state: CopilotState, action: CopilotAction): CopilotState => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SUBMIT":
      return { ...state, machineState: "submitting", error: undefined };
    case "STREAMING":
      return { ...state, machineState: "streaming", currentRunId: action.runId };
    case "SUCCESS":
      return {
        ...state,
        machineState: "completed",
        output: action.output,
        runs: action.run ? [action.run, ...state.runs] : state.runs,
      };
    case "SET_RUNS":
      return { ...state, runs: action.runs };
    case "SET_HUNKS":
      return { ...state, hunks: action.hunks };
    case "TOGGLE_HUNK":
      return {
        ...state,
        hunks: state.hunks.map((hunk) => (hunk.id === action.id ? { ...hunk, accepted: action.accepted } : hunk)),
      };
    case "SET_HEALTH":
      return { ...state, endpointHealth: action.health };
    case "SET_KPI":
      return { ...state, feedbackKpi: action.kpi };
    case "ERROR":
      return { ...state, machineState: "failed", error: action.error };
    case "AUDIT":
      return { ...state, auditTrail: [action.event, ...state.auditTrail].slice(0, COPILOT_DEFAULTS.auditTrailLimit) };
    default:
      return state;
  }
};

export const useCopilotStore = () => {
  const [state, dispatch] = useReducer(reducer, defaultState);

  const appendAudit = useCallback((action: string, result: "ok" | "failed", details?: string) => {
    dispatch({
      type: "AUDIT",
      event: {
        action,
        actor: state.role,
        scope: state.repo,
        result,
        timestamp: new Date().toISOString(),
        details,
      },
    });
  }, [state.repo, state.role]);

  const initialize = useCallback(async () => {
    const [health, runs, feedback] = await Promise.all([
      copilotClient.getEndpointHealth(),
      copilotClient.listRuns(8),
      copilotClient.getEntrypointFeedback().catch(() => ({})),
    ]);

    dispatch({ type: "SET_HEALTH", health });
    dispatch({ type: "SET_RUNS", runs: runs.map((run) => copilotClient.toRunSummary(run)) });
    dispatch({ type: "SET_KPI", kpi: feedback });
  }, []);

  const submit = useCallback(async () => {
    if (!canRunMode(state.role, state.mode)) {
      dispatch({ type: "ERROR", error: `Ruolo ${state.role} non autorizzato per ${state.mode}` });
      appendAudit("submit_blocked", "failed", "RBAC");
      return;
    }

    if (isHighRiskMode(state.mode) && !window.confirm(`Confermi l'azione ${state.mode}?`)) {
      appendAudit("high_risk_cancelled", "failed");
      return;
    }

    dispatch({ type: "SUBMIT" });

    try {
      const payload = {
        task: state.task,
        repo: state.repo,
        mode: state.mode,
        human_approved: isHighRiskMode(state.mode),
      };

      if (state.mode === "analyze") {
        const result = await copilotClient.runSync(payload);
        const output = copilotClient.toStructuredOutput(result);
        dispatch({ type: "SUCCESS", output, run: copilotClient.toRunSummary(result, state.mode) });
        const patch = (result.patch_status?.patch as string | undefined) ?? "";
        dispatch({ type: "SET_HUNKS", hunks: parseDiffHunks(patch) });
      } else {
        const asyncRun = await copilotClient.runAsync(payload);
        const runId = String(asyncRun.run_id ?? asyncRun.id ?? "");
        dispatch({ type: "STREAMING", runId });

        let completed = false;
        for (let i = 0; i < COPILOT_DEFAULTS.pollMaxAttempts && !completed; i += 1) {
          const run = await copilotClient.getRun(runId);
          const runState = String(run.state ?? "queued");
          if (runState === "ok" || runState === "failed") {
            completed = true;
            const result = await copilotClient.getRunResult(runId);
            const output = copilotClient.toStructuredOutput(result);
            dispatch({ type: "SUCCESS", output, run: copilotClient.toRunSummary(run, state.mode) });
            const patch = (result.patch as string | undefined) ?? "";
            dispatch({ type: "SET_HUNKS", hunks: parseDiffHunks(patch) });
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, COPILOT_DEFAULTS.pollIntervalMs));
        }

        if (!completed) {
          throw new Error("Timeout polling run result");
        }
      }

      appendAudit("submit", "ok", state.mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore sconosciuto";
      dispatch({ type: "ERROR", error: message });
      appendAudit("submit", "failed", message);
    }
  }, [appendAudit, state.mode, state.repo, state.role, state.task]);

  const sendFeedback = useCallback(async (accepted: boolean) => {
    await copilotClient.sendEntrypointFeedback({
      action: `copilot_${state.mode}`,
      accepted,
      rating: accepted ? 5 : 2,
      metadata: { run_id: state.currentRunId },
    });
    const feedback = await copilotClient.getEntrypointFeedback();
    dispatch({ type: "SET_KPI", kpi: feedback });
    appendAudit("feedback", "ok", accepted ? "accepted" : "rejected");
  }, [appendAudit, state.currentRunId, state.mode]);

  const acceptAll = useCallback(() => {
    state.hunks.forEach((hunk) => dispatch({ type: "TOGGLE_HUNK", id: hunk.id, accepted: true }));
  }, [state.hunks]);

  const rejectAll = useCallback(() => {
    state.hunks.forEach((hunk) => dispatch({ type: "TOGGLE_HUNK", id: hunk.id, accepted: false }));
  }, [state.hunks]);

  const selectedPatch = useMemo(
    () => state.hunks.filter((h) => h.accepted).map((hunk) => `${hunk.header}\n${hunk.body}`).join("\n"),
    [state.hunks],
  );

  return {
    state,
    selectedPatch,
    initialize,
    submit,
    sendFeedback,
    acceptAll,
    rejectAll,
    toggleHunk: (id: string, accepted: boolean) => dispatch({ type: "TOGGLE_HUNK", id, accepted }),
    setField: (field: "task" | "repo" | "mode" | "role", value: string) => dispatch({ type: "SET_FIELD", field, value }),
  };
};

export { parseDiffHunks, reducer };
export type { CopilotState };
