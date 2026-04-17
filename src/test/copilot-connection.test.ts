import { afterEach, describe, expect, it, vi } from "vitest";
import { probeCopilotConnection } from "@/features/copilot/settings";

describe("copilot connection probe", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns invalid config when base url is missing", async () => {
    const result = await probeCopilotConnection({ apiToken: "x" });
    expect(result.ok).toBe(false);
    expect(result.probes[0].message).toContain("Base URL");
  });

  it("probes health and ollama endpoints", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const result = await probeCopilotConnection({ apiBaseUrl: "localhost:8000", apiToken: "tok" });

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
