import { beforeEach, describe, expect, it, vi } from "vitest";
import { backendClient } from "@/api";
import { invokeCatalogEndpoint } from "@/features/copilot/catalog-client";

describe("catalog client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses generated backend operation when available", async () => {
    const spy = vi.spyOn(backendClient, "call").mockResolvedValueOnce({ ok: true });

    const result = await invokeCatalogEndpoint({ method: "GET", path: "/v1/runs" });

    expect(result).toEqual({ ok: true });
    expect(spy).toHaveBeenCalled();
  });

  it("falls back to raw fetch for non-generated endpoints", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }),
    );

    const result = await invokeCatalogEndpoint({ method: "POST", path: "/v1/copilot/intents/detect", body: { task: "x" } });

    expect(result).toEqual({ ok: true });
    expect(fetchSpy).toHaveBeenCalled();
  });
});
