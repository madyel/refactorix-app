import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ApiOperations, HttpMethod } from "./operations";
import { apiOperations } from "./operations";
import { getConfiguredApiBaseUrl } from "@/config/runtime-config";
import { getCopilotApiKey, getCopilotApiToken } from "@/features/copilot/settings";
import { getValidAccessToken, refreshAfterUnauthorized } from "@/features/copilot/auth-session";

export type JsonObject = Record<string, unknown>;

export interface RequestConfig<
  TBody = never,
  TPath extends JsonObject | undefined = undefined,
  TQuery extends JsonObject | undefined = undefined,
> {
  pathParams?: TPath;
  query?: TQuery;
  body?: TBody extends never ? never : TBody;
  signal?: AbortSignal;
  headers?: HeadersInit;
  timeoutMs?: number;
}

export class ApiHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly method: HttpMethod,
    public readonly path: string,
    public readonly url: string,
    public readonly correlationId?: string,
    public readonly remediation?: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

const remediationByStatus = (status: number): string | undefined => {
  if (status === 401) return "Sessione scaduta: esegui refresh sessione o login.";
  if (status === 403) return "Accesso negato: verifica ruolo RBAC o token CSRF.";
  if (status === 404) return "Endpoint non trovato: verifica API base URL e versione backend.";
  if (status === 409) return "Conflitto stato risorsa: ricarica i dati e riprova.";
  if (status === 422) return "Payload non valido: controlla campi obbligatori e formato.";
  if (status === 429 || status >= 500) return "Servizio temporaneamente degradato: riprova con backoff.";
  return undefined;
};

const parseErrorBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  try {
    const text = await response.text();
    return text || undefined;
  } catch {
    return undefined;
  }
};

export const buildPath = (template: string, pathParams?: JsonObject): string => {
  if (!pathParams) return template;

  return template.replace(/\{(.*?)\}/g, (_, key: string) => {
    const value = pathParams[key];

    if (value === undefined || value === null) {
      throw new Error(`Missing path param: ${key}`);
    }

    return encodeURIComponent(String(value));
  });
};

export const appendQuery = (path: string, query?: JsonObject): string => {
  if (!query) return path;

  const search = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, String(entry)));
      return;
    }

    search.append(key, String(value));
  });

  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` : path;
};

type OperationId = keyof ApiOperations;
type OperationMethod<T extends OperationId> = ApiOperations[T]["method"];
type OperationResponse<T extends OperationId> = ApiOperations[T]["response"];
type OperationBody<T extends OperationId> = ApiOperations[T]["requestBody"];
type OperationPathParams<T extends OperationId> = ApiOperations[T]["pathParams"];
type OperationQuery<T extends OperationId> = ApiOperations[T]["query"];

export type OperationRequestConfig<T extends OperationId> = RequestConfig<
  OperationBody<T>,
  OperationPathParams<T>,
  OperationQuery<T>
>;

async function performRequest<T extends OperationId>(
  operationId: T,
  config?: OperationRequestConfig<T>,
): Promise<OperationResponse<T>> {
  const operation = apiOperations[operationId];
  const method: HttpMethod = operation.method;
  const path = operation.path;

  const url = `${getConfiguredApiBaseUrl()}${appendQuery(
    buildPath(path, config?.pathParams as JsonObject | undefined),
    config?.query as JsonObject | undefined,
  )}`;

  const manualToken = getCopilotApiToken();
  const sessionToken = await getValidAccessToken();
  const token = sessionToken ?? manualToken;
  const apiKey = getCopilotApiKey();
  const correlationId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `cid-${Date.now()}`;

  const buildHeaders = (overrideToken?: string) => ({
    "Content-Type": "application/json",
    "x-correlation-id": correlationId,
    ...(overrideToken ? { Authorization: `Bearer ${overrideToken}` } : {}),
    ...(apiKey ? { "x-api-key": apiKey } : {}),
    ...config?.headers,
  });

  const doFetch = async (overrideToken?: string) => {
    const timeoutMs = config?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    const timeoutController = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      timeoutController.abort();
    }, timeoutMs);

    if (config?.signal) {
      if (config.signal.aborted) {
        timeoutController.abort();
      } else {
        config.signal.addEventListener("abort", () => timeoutController.abort(), { once: true });
      }
    }

    try {
      return await fetch(url, {
        method,
        credentials: "include",
        signal: timeoutController.signal,
        headers: buildHeaders(overrideToken),
        body: config?.body === undefined ? undefined : JSON.stringify(config.body),
      });
    } catch (error) {
      if (timedOut) {
        throw new ApiHttpError(
          `API request timeout (${timeoutMs}ms) for ${method} ${path}`,
          408,
          method,
          path,
          url,
          correlationId,
          "Riduci payload o verifica latenza rete/backend.",
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  let response = await doFetch(token ?? undefined);

  if (response.status === 401) {
    const refreshedToken = await refreshAfterUnauthorized();
    if (refreshedToken) {
      response = await doFetch(refreshedToken);
    }
  }

  if (!response.ok) {
    const details = await parseErrorBody(response);
    throw new ApiHttpError(
      `API request failed (${response.status}) for ${method} ${path}`,
      response.status,
      method,
      path,
      url,
      response.headers.get("x-correlation-id") ?? correlationId,
      remediationByStatus(response.status),
      details,
    );
  }

  if (response.status === 204) {
    return undefined as OperationResponse<T>;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as OperationResponse<T>;
  }

  return (await response.text()) as OperationResponse<T>;
}

export const backendClient = {
  call: performRequest,
};

export const backendKeys = {
  byOperation: <T extends OperationId>(operationId: T, config?: OperationRequestConfig<T>) =>
    [operationId, config] as const,
};

type GetOperationId = {
  [K in OperationId]: OperationMethod<K> extends "GET" ? K : never;
}[OperationId];

type MutationOperationId = Exclude<OperationId, GetOperationId>;

export const useBackendQuery = <T extends GetOperationId>(
  operationId: T,
  config?: OperationRequestConfig<T>,
  options?: Omit<UseQueryOptions<OperationResponse<T>, Error, OperationResponse<T>, QueryKey>, "queryKey" | "queryFn">,
) =>
  useQuery({
    queryKey: backendKeys.byOperation(operationId, config),
    queryFn: () => backendClient.call(operationId, config),
    ...options,
  });

export const useBackendMutation = <T extends MutationOperationId>(
  operationId: T,
  options?: UseMutationOptions<OperationResponse<T>, Error, OperationRequestConfig<T>>,
) =>
  useMutation({
    mutationFn: (config) => backendClient.call(operationId, config),
    ...options,
  });
