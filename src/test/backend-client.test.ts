import { describe, expect, it } from "vitest";
import { apiOperations } from "@/api/generated/operations";
import { appendQuery, buildPath } from "@/api/generated/backend-client";

describe("backend client url helpers", () => {
  it("builds templated paths", () => {
    expect(buildPath("/v1/runs/{run_id}", { run_id: "abc-123" })).toBe("/v1/runs/abc-123");
  });

  it("throws when a path param is missing", () => {
    expect(() => buildPath("/v1/runs/{run_id}", {})).toThrow("Missing path param: run_id");
  });

  it("appends query values and skips nullish values", () => {
    const path = appendQuery("/v1/runs", { limit: 10, cursor: undefined, status: "running" });
    expect(path).toBe("/v1/runs?limit=10&status=running");
  });

  it("exposes operation metadata from openapi contract", () => {
    expect(apiOperations["health_health_get"]).toEqual({
      method: "GET",
      path: "/health",
    });
  });
});
