import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ApiOperations, HttpMethod } from "./operations";
import { apiOperations } from "./operations";

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
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

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

  const url = `${API_BASE_URL}${appendQuery(
    buildPath(path, config?.pathParams as JsonObject | undefined),
    config?.query as JsonObject | undefined,
  )}`;

  const response = await fetch(url, {
    method,
    signal: config?.signal,
    headers: {
      "Content-Type": "application/json",
      ...config?.headers,
    },
    body: config?.body === undefined ? undefined : JSON.stringify(config.body),
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) for ${method} ${path}`);
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
