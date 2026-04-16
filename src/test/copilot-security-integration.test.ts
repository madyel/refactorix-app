import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendClient } from "@/api";
import { canRunMode } from "@/features/copilot/rbac";
import { copilotClient } from "@/features/copilot/client";

describe("copilot security/integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("enforces RBAC mode gating", () => {
    expect(canRunMode("guest", "analyze")).toBe(true);
    expect(canRunMode("guest", "apply_patch")).toBe(false);
    expect(canRunMode("reviewer", "apply_patch")).toBe(true);
    expect(canRunMode("reviewer", "commit")).toBe(false);
  });

  it("retries once when csrf/session mismatch occurs", async () => {
    const spy = vi.spyOn(backendClient, "call");
    spy
      .mockRejectedValueOnce(new Error("API request failed (403) for POST /v1/ai-dev"))
      .mockResolvedValueOnce({ user: "ok" })
      .mockResolvedValueOnce({ run_id: "r1", mode: "analyze", candidate_files: [], architecture_analysis: {}, final_review: {}, plan: [], patch_status: {}, test_status: {}, git_status: {}, rag: {}, contract: {}, task: "t" });

    const response = await copilotClient.runSync({ task: "t", repo: ".", mode: "analyze" });
    expect((response as { run_id: string }).run_id).toBe("r1");
    expect(spy).toHaveBeenCalledTimes(3);
  });
});
