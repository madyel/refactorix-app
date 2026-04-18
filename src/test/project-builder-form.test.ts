import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useProjectBuilderForm } from "@/hooks/use-project-builder-form";

describe("project builder form", () => {
  it("hydrates stack/template/model from runtime options", () => {
    const { result } = renderHook(() =>
      useProjectBuilderForm({
        stackOptions: ["typescript", "python"],
        templateOptions: ["nextjs", "fastapi"],
        modelOptions: ["llama3", "gpt-4.1"],
      }),
    );

    expect(result.current.values.stack).toBe("typescript");
    expect(result.current.values.template).toBe("nextjs");
    expect(result.current.values.model).toBe("llama3");
  });
});
