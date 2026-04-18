import { apiOperations } from "@/api/generated/operations";
import { backendClient } from "@/api";
import { getConfiguredApiBaseUrl } from "@/config/runtime-config";
import { getCopilotApiKey, getCopilotApiToken } from "./settings";

export type CatalogHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface CatalogRequest {
  method: CatalogHttpMethod;
  path: string;
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

const buildPath = (template: string, pathParams?: Record<string, string | number>) => {
  if (!pathParams) return template;

  return template.replace(/\{(.*?)\}/g, (_, key: string) => {
    const value = pathParams[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing path param: ${key}`);
    }

    return encodeURIComponent(String(value));
  });
};

const withQuery = (path: string, query?: CatalogRequest["query"]) => {
  if (!query) return path;
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.append(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
};

const findOperationId = (method: CatalogHttpMethod, path: string) => {
  const entry = Object.entries(apiOperations).find(([, op]) => op.method === method && op.path === path);
  return entry?.[0] as keyof typeof apiOperations | undefined;
};

export const invokeCatalogEndpoint = async (request: CatalogRequest): Promise<unknown> => {
  const operationId = findOperationId(request.method, request.path);

  if (operationId) {
    return backendClient.call(operationId, {
      pathParams: request.pathParams as never,
      query: request.query as never,
      body: request.body as never,
    });
  }

  const token = getCopilotApiToken();
  const apiKey = getCopilotApiKey();
  const url = `${getConfiguredApiBaseUrl()}${withQuery(buildPath(request.path, request.pathParams), request.query)}`;

  const response = await fetch(url, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { "x-api-key": apiKey } : {}),
    },
    body: request.body === undefined ? undefined : JSON.stringify(request.body),
  });

  if (!response.ok) {
    throw new Error(`Catalog call failed (${response.status}) ${request.method} ${request.path}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
};

export const recommendedEndpoints: Array<Pick<CatalogRequest, "method" | "path">> = [
  { method: "POST", path: "/v1/copilot/intents/detect" },
  { method: "POST", path: "/v1/copilot/prompts/compose" },
  { method: "POST", path: "/v1/copilot/responses/normalize" },
  { method: "GET", path: "/v1/runs/{run_id}/artifacts" },
  { method: "POST", path: "/v1/runs/{run_id}/promote" },
  { method: "POST", path: "/v1/ide/sessions/{session_id}/share" },
  { method: "GET", path: "/v1/system/health/dependencies" },
];
