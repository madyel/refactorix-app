import { describe, expect, it, vi, beforeEach } from "vitest";
import { backendClient } from "@/api";
import { copilotClient } from "@/features/copilot/client";

describe("copilot client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps structured output", () => {
    const output = copilotClient.toStructuredOutput({
      task: "analyze",
      mode: "analyze",
      run_id: "run-1",
      candidate_files: ["a.ts"],
      architecture_analysis: { summary: "OK" },
      final_review: { risks: ["risk"] },
      plan: ["next"],
    } as never);

    expect(output.executiveSummary).toBe("OK");
    expect(output.risks).toContain("risk");
  });

  it("retrieves endpoint health with graceful degradation", async () => {
    const spy = vi.spyOn(backendClient, "call");
    spy.mockResolvedValueOnce({ ok: true });
    spy.mockRejectedValueOnce(new Error("down"));
    spy.mockResolvedValueOnce({ ok: true });

    const health = await copilotClient.getEndpointHealth();

    expect(health).toEqual({ ollama: "online", qdrant: "offline", temporal: "online" });
  });
});
