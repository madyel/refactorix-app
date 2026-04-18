import { describe, expect, it, vi } from "vitest";
import { pickWorkspaceDirectory } from "@/features/workspace/picker";

describe("workspace picker", () => {
  it("uses desktop bridge when available", async () => {
    (window as unknown as { desktop?: unknown }).desktop = {
      workspace: {
        pickDirectory: vi.fn().mockResolvedValue({ canceled: false, path: "/tmp/ws" }),
      },
    };

    const selected = await pickWorkspaceDirectory("/workspace");
    expect(selected).toBe("/tmp/ws");
  });

  it("falls back to prompt in web mode", async () => {
    (window as unknown as { desktop?: unknown }).desktop = undefined;
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("/custom/workspace");

    const selected = await pickWorkspaceDirectory("/workspace");
    expect(selected).toBe("/custom/workspace");

    promptSpy.mockRestore();
  });
});
