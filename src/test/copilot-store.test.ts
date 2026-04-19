import { describe, expect, it } from "vitest";
import { parseDiffHunks, reducer, type CopilotState } from "@/features/copilot/store";

describe("copilot store", () => {
  it("parses hunks from patch", () => {
    const hunks = parseDiffHunks("@@ -1 +1 @@\n-old\n+new\n@@ -3 +3 @@\n-a\n+b");
    expect(hunks).toHaveLength(2);
    expect(hunks[0].accepted).toBe(true);
  });

  it("handles state transitions", () => {
    const initial: CopilotState = {
      machineState: "idle",
      mode: "analyze",
      task: "",
      repo: ".",
      role: "operator",
      runs: [],
      hunks: [],
      endpointHealth: { ollama: "unknown", qdrant: "unknown", temporal: "unknown" },
      auditTrail: [],
    };

    const submitting = reducer(initial, { type: "SUBMIT" });
    const completed = reducer(submitting, {
      type: "SUCCESS",
      output: {
        executiveSummary: "ok",
        bulletPoints: [],
        risks: [],
        nextSteps: [],
        raw: {},
      },
    });

    expect(submitting.machineState).toBe("submitting");
    expect(completed.machineState).toBe("completed");
  });
});
