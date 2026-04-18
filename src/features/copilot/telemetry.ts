export type CopilotCommandMode = "analyze" | "dry_run" | "apply_patch" | "commit";
export type FunnelStep = "analyze" | "patch_generated" | "patch_applied" | "commit";

export interface CopilotTelemetrySnapshot {
  totalCalls: number;
  failedCalls: number;
  averageLatencyMs: number;
  byOperation: Record<string, { calls: number; failures: number; avgLatencyMs: number }>;
  funnel: Record<FunnelStep, number>;
  updatedAt: string;
}

const STORAGE_KEY = "copilot_telemetry_v1";
const isBrowser = typeof window !== "undefined";

const emptySnapshot = (): CopilotTelemetrySnapshot => ({
  totalCalls: 0,
  failedCalls: 0,
  averageLatencyMs: 0,
  byOperation: {},
  funnel: {
    analyze: 0,
    patch_generated: 0,
    patch_applied: 0,
    commit: 0,
  },
  updatedAt: new Date(0).toISOString(),
});

const read = (): CopilotTelemetrySnapshot => {
  if (!isBrowser) return emptySnapshot();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptySnapshot();

  try {
    return { ...emptySnapshot(), ...(JSON.parse(raw) as Partial<CopilotTelemetrySnapshot>) };
  } catch {
    return emptySnapshot();
  }
};

const write = (snapshot: CopilotTelemetrySnapshot) => {
  if (!isBrowser) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
};

const recalcAverage = (prevAvg: number, prevCalls: number, currentLatency: number) =>
  (prevAvg * prevCalls + currentLatency) / (prevCalls + 1);

export const copilotTelemetry = {
  trackCall(operation: string, latencyMs: number, ok: boolean) {
    const snapshot = read();
    const nextCalls = snapshot.totalCalls + 1;

    const op = snapshot.byOperation[operation] ?? { calls: 0, failures: 0, avgLatencyMs: 0 };
    const nextOpCalls = op.calls + 1;

    const next: CopilotTelemetrySnapshot = {
      ...snapshot,
      totalCalls: nextCalls,
      failedCalls: snapshot.failedCalls + (ok ? 0 : 1),
      averageLatencyMs: recalcAverage(snapshot.averageLatencyMs, snapshot.totalCalls, latencyMs),
      byOperation: {
        ...snapshot.byOperation,
        [operation]: {
          calls: nextOpCalls,
          failures: op.failures + (ok ? 0 : 1),
          avgLatencyMs: recalcAverage(op.avgLatencyMs, op.calls, latencyMs),
        },
      },
      updatedAt: new Date().toISOString(),
    };

    write(next);
  },

  trackFunnelStep(step: FunnelStep) {
    const snapshot = read();
    const next: CopilotTelemetrySnapshot = {
      ...snapshot,
      funnel: {
        ...snapshot.funnel,
        [step]: snapshot.funnel[step] + 1,
      },
      updatedAt: new Date().toISOString(),
    };

    write(next);
  },

  getSnapshot(): CopilotTelemetrySnapshot {
    return read();
  },

  reset() {
    write(emptySnapshot());
  },
};
