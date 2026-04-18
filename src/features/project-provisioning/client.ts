import { backendClient } from "@/api";

export interface ProjectProvisionInput {
  name: string;
  stack?: string;
  template?: string;
  path?: string;
  initGit?: boolean;
  installDeps?: boolean;
  request: string;
}

export interface ProjectProvisionResult {
  repoPath: string;
  projectCreated: boolean;
  codeGenerated: boolean;
  summary: string;
  nextSteps: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const pickFirstString = (source: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
};

const normalizeRepoPath = (
  createResponse: Record<string, unknown>,
  fallbackBasePath: string | undefined,
  projectName: string,
): string => {
  const fromResponse = pickFirstString(createResponse, [
    "repo_path",
    "project_path",
    "path",
    "repoPath",
    "projectPath",
  ]);

  if (fromResponse) return fromResponse;

  if (fallbackBasePath) {
    return `${fallbackBasePath.replace(/\/$/, "")}/${projectName}`;
  }

  return projectName;
};

export const createProjectOnly = async (
  input: Omit<ProjectProvisionInput, "request">,
): Promise<ProjectProvisionResult> => {
  const createResponse = await backendClient.call("create_project_endpoint_v1_projects_create_post", {
    body: {
      name: input.name,
      stack: input.stack || undefined,
      template: input.template || undefined,
      path: input.path || undefined,
      init_git: input.initGit,
      install_deps: input.installDeps,
    },
  });

  const createPayload = isRecord(createResponse) ? createResponse : {};
  const repoPath = normalizeRepoPath(createPayload, input.path, input.name);

  return {
    repoPath,
    projectCreated: true,
    codeGenerated: false,
    summary: `Progetto ${input.name} creato con successo in ${repoPath}.`,
    nextSteps: [
      "Apri Project Viewer per esplorare la struttura.",
      "Lancia 'Crea framework software' per generare il codice iniziale.",
    ],
  };
};

export const createAndGenerateProject = async (
  input: ProjectProvisionInput,
): Promise<ProjectProvisionResult> => {
  const created = await createProjectOnly(input);

  await backendClient.call("generate_project_code_endpoint_v1_projects_generate_post", {
    body: {
      repo_path: created.repoPath,
      request: input.request,
    },
  });

  return {
    repoPath: created.repoPath,
    projectCreated: true,
    codeGenerated: true,
    summary: `Codice generato con successo nel repository ${created.repoPath}.`,
    nextSteps: [
      "Apri l'IDE e verifica i file generati.",
      "Esegui test/lint del progetto appena generato.",
      "Usa Copilot panel per review e patch incrementali.",
    ],
  };
};
