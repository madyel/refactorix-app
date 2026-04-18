import { afterEach, describe, expect, it, vi } from "vitest";
import { backendClient } from "@/api";
import { createAndGenerateProject, createProjectOnly } from "@/features/project-provisioning/client";

describe("project provisioning client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates project and infers repo path from response", async () => {
    const spy = vi.spyOn(backendClient, "call").mockResolvedValueOnce({ repo_path: "/workspace/demo" });

    const result = await createProjectOnly({
      name: "demo",
      stack: "python",
      template: "fastapi",
      path: "/workspace",
      initGit: true,
      installDeps: false,
    });

    expect(result.repoPath).toBe("/workspace/demo");
    expect(result.projectCreated).toBe(true);
    expect(result.codeGenerated).toBe(false);
    expect(spy).toHaveBeenCalledWith("create_project_endpoint_v1_projects_create_post", expect.anything());
  });

  it("runs create + generate sequence", async () => {
    const spy = vi
      .spyOn(backendClient, "call")
      .mockResolvedValueOnce({ project_path: "/workspace/demo" })
      .mockResolvedValueOnce({ ok: true });

    const result = await createAndGenerateProject({
      name: "demo",
      stack: "python",
      template: "fastapi",
      path: "/workspace",
      initGit: true,
      installDeps: false,
      request: "create api and auth",
    });

    expect(result.projectCreated).toBe(true);
    expect(result.codeGenerated).toBe(true);
    expect(spy).toHaveBeenNthCalledWith(2, "generate_project_code_endpoint_v1_projects_generate_post", {
      body: {
        repo_path: "/workspace/demo",
        request: "create api and auth",
      },
    });
  });
});
