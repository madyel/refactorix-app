import type { RequestConfig } from "./generated/backend-client";

export type { JsonObject, OperationRequestConfig, RequestConfig } from "./generated/backend-client";
export type { ApiOperations, HttpMethod, OperationContract } from "./generated/operations";
export type * from "./schemas";

export type QueryRequestConfig<
  TPath extends Record<string, unknown> | undefined = undefined,
  TQuery extends Record<string, unknown> | undefined = undefined,
> = Omit<RequestConfig<never, TPath, TQuery>, "body">;
