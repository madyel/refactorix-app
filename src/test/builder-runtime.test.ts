import { describe, expect, it } from "vitest";
import { humanizeServiceDetail } from "@/hooks/use-builder-runtime";

describe("builder runtime detail formatter", () => {
  it("returns actionable message when endpoint responds with html", () => {
    const detail = humanizeServiceDetail("<!doctype html><html><head></head><body>app</body></html>");
    expect(detail).toContain("Endpoint ha risposto HTML");
    expect(detail).toContain("API Base URL");
  });

  it("extracts readable detail from backend payload", () => {
    const detail = humanizeServiceDetail({ status: "offline", message: "Ollama not reachable" });
    expect(detail).toBe("Ollama not reachable");
  });
});
