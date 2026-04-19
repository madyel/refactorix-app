import { describe, expect, it } from "vitest";
import { createCompareReview } from "@/features/workspace/sync";

describe("workspace sync compare review", () => {
  it("detects unchanged files", () => {
    const review = createCompareReview({
      localPath: "/local/app",
      remotePath: "/workspace/app",
      filePath: "src/main.ts",
      localContent: "const a = 1;",
      remoteContent: "const a = 1;",
    });

    expect(review.hasChanges).toBe(false);
    expect(review.summary).toContain("allineati");
  });

  it("builds diff preview when lines differ", () => {
    const review = createCompareReview({
      localPath: "/local/app",
      remotePath: "/workspace/app",
      filePath: "src/main.ts",
      localContent: "const a = 1;\nconsole.log(a);",
      remoteContent: "const a = 2;\nconsole.log(a);",
    });

    expect(review.hasChanges).toBe(true);
    expect(review.diffPreview).toContain("- const a = 1;");
    expect(review.diffPreview).toContain("+ const a = 2;");
  });
});
