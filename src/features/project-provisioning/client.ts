import { backendClient } from "@/api";
import { ApiHttpError } from "@/api/generated/backend-client";

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

const stringifyValidationLocation = (location: unknown): string => {
  if (!Array.isArray(location)) return "";
  const parts = location.filter((part): part is string => typeof part === "string" && part.length > 0);
  if (parts.length === 0) return "";
  return parts.join(".");
};

const parseValidationDetails = (details: unknown): string | undefined => {
  if (!Array.isArray(details)) return undefined;

  const messages = details
    .map((item) => {
      if (!isRecord(item)) return undefined;
      const message = typeof item.msg === "string" ? item.msg : undefined;
      if (!message) return undefined;
      const location = stringifyValidationLocation(item.loc);
      return location ? `${location}: ${message}` : message;
    })
    .filter((message): message is string => Boolean(message));

  if (messages.length === 0) return undefined;
  return messages.join(" | ");
};

const parseApiErrorDetails = (details: unknown): string | undefined => {
  if (!isRecord(details)) return undefined;

  const directMessage = pickFirstString(details, ["message", "error", "detail"]);
  if (directMessage) return directMessage;

  const parsedValidation = parseValidationDetails(details.detail);
  if (parsedValidation) return parsedValidation;

  return undefined;
};

export const toProjectProvisionErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiHttpError) {
    const detailedMessage = parseApiErrorDetails(error.details);
    if (detailedMessage) return detailedMessage;
    if (error.remediation) return `${error.message}. ${error.remediation}`;
    return error.message;
  }

  if (error instanceof Error) return error.message;

  return fallback;
};

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
