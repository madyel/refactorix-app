import { describe, expect, it } from "vitest";
import { normalizeTree } from "@/features/project-explorer/tree";

describe("project tree normalization", () => {
  it("normalizes object-map tree payload", () => {
    const result = normalizeTree({
      src: {
        "index.ts": "console.log('x')",
      },
      "README.md": "# title",
    });

    expect(result[0]).toMatchObject({ name: "src", type: "folder" });
    expect(result[1]).toMatchObject({ name: "README.md", type: "file", language: "markdown" });
  });

  it("normalizes wrapped payload (tree/data/files)", () => {
    const result = normalizeTree({
      data: {
        tree: [
          { name: "package.json", type: "file" },
          { name: "src", type: "folder", children: [{ name: "main.ts", type: "file" }] },
        ],
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("package.json");
    expect(result[1].children?.[0].name).toBe("main.ts");
  });
});
