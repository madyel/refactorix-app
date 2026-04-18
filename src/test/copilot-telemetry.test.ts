import { beforeEach, describe, expect, it } from "vitest";
import { copilotTelemetry } from "@/features/copilot/telemetry";

describe("copilot telemetry", () => {
  beforeEach(() => {
    localStorage.clear();
    copilotTelemetry.reset();
  });

  it("tracks calls and failures", () => {
    copilotTelemetry.trackCall("ai-dev.sync", 120, true);
    copilotTelemetry.trackCall("ai-dev.sync", 180, false);

    const snapshot = copilotTelemetry.getSnapshot();

    expect(snapshot.totalCalls).toBe(2);
    expect(snapshot.failedCalls).toBe(1);
    expect(Math.round(snapshot.averageLatencyMs)).toBe(150);
    expect(snapshot.byOperation["ai-dev.sync"]).toEqual({
      calls: 2,
      failures: 1,
      avgLatencyMs: 150,
    });
  });

  it("tracks funnel progression", () => {
    copilotTelemetry.trackFunnelStep("analyze");
    copilotTelemetry.trackFunnelStep("patch_generated");
    copilotTelemetry.trackFunnelStep("commit");

    const snapshot = copilotTelemetry.getSnapshot();

    expect(snapshot.funnel.analyze).toBe(1);
    expect(snapshot.funnel.patch_generated).toBe(1);
    expect(snapshot.funnel.commit).toBe(1);
  });
});
