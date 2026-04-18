import { describe, expect, it } from "vitest";
import { humanizeServiceDetail, parseProjectsTemplatesResponse } from "@/hooks/use-builder-runtime";

describe("builder runtime detail formatter", () => {
  it("returns actionable message when endpoint responds with html", () => {
    const detail = humanizeServiceDetail("<!doctype html><html><head></head><body>app</body></html>");
    expect(detail).toContain("Endpoint ha risposto HTML");
    expect(detail).toContain("API Base URL");
  });

  it("formats connected payloads without dumping raw json", () => {
    const detail = humanizeServiceDetail({ connected: true, selected_model: "deepseek", base_url: "http://localhost:11434" });
    expect(detail).toContain("Connesso");
    expect(detail).toContain("model=deepseek");
    expect(detail).toContain("endpoint=http://localhost:11434");
  });

  it("extracts readable detail from backend payload", () => {
    const detail = humanizeServiceDetail({ status: "offline", message: "Ollama not reachable" });
    expect(detail).toBe("Ollama not reachable");
  });
});

describe("projects templates parser", () => {
  it("parses stacks/templates and allowed combinations", () => {
    const parsed = parseProjectsTemplatesResponse({
      stacks: ["python", "typescript"],
      templates_by_stack: {
        python: ["fastapi"],
        typescript: ["nextjs", "express"],
      },
      legacy_aliases: { py: "python" },
      allowed_combinations: [
        { stack: "python", template: "fastapi" },
        { stack: "typescript", template: "nextjs" },
      ],
    });

    expect(parsed.stacks).toEqual(["python", "typescript"]);
    expect(parsed.templatesByStack.typescript).toEqual(["nextjs", "express"]);
    expect(parsed.legacyAliases.py).toBe("python");
    expect(parsed.allowedCombinations).toHaveLength(2);
  });
});
