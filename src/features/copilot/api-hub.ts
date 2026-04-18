import { backendClient } from "@/api";
import { invokeCatalogEndpoint } from "./catalog-client";

export const copilotApiHub = {
  auth: {
    sessionMe: () => backendClient.call("session_me_v1_auth_session_me_get"),
    whoAmI: () => backendClient.call("who_am_i_v1_auth_me_get"),
    login: (role?: string, subject?: string) =>
      backendClient.call("session_login_v1_auth_session_login_post", { query: { role, subject } }),
    refresh: () => invokeCatalogEndpoint({ method: "POST", path: "/v1/auth/session/refresh" }),
    logout: () => backendClient.call("session_logout_v1_auth_session_logout_post"),
  },

  system: {
    ollamaStatus: () => backendClient.call("ollama_status_v1_system_ollama_status_get"),
    qdrantStatus: () => backendClient.call("qdrant_status_v1_system_qdrant_status_get"),
    temporalStatus: () => backendClient.call("temporal_status_v1_system_temporal_status_get"),
    temporalHealth: () => invokeCatalogEndpoint({ method: "GET", path: "/v1/system/temporal/health" }),
    workflowGoldenPath: () => backendClient.call("workflow_golden_path_v1_system_workflow_golden_path_get"),
    dependenciesHealth: () => invokeCatalogEndpoint({ method: "GET", path: "/v1/system/health/dependencies" }),
    selectModel: (model: string) =>
      backendClient.call("ollama_select_model_v1_system_ollama_select_model_post", { body: { model } }),
  },

  projects: {
    templates: () => invokeCatalogEndpoint({ method: "GET", path: "/v1/projects/templates" }),
    create: (body: Record<string, unknown>) =>
      backendClient.call("create_project_endpoint_v1_projects_create_post", { body }),
    generate: (body: Record<string, unknown>) =>
      backendClient.call("generate_project_code_endpoint_v1_projects_generate_post", { body }),
    discovery: () => backendClient.call("discover_projects_v1_projects_discovery_get"),
    tree: (projectPath: string, depth?: number) =>
      backendClient.call("project_tree_v1_projects_tree_get", { query: { project_path: projectPath, depth } }),
  },

  runs: {
    list: (limit?: number) => backendClient.call("list_runs_v1_runs_get", { query: { limit } }),
    byId: (runId: string) => backendClient.call("get_run_v1_runs__run_id__get", { pathParams: { run_id: runId } }),
    result: (runId: string) =>
      backendClient.call("get_run_result_v1_runs__run_id__result_get", { pathParams: { run_id: runId } }),
    events: (runId: string) => backendClient.call("run_events_v1_runs__run_id__events_get", { pathParams: { run_id: runId } }),
    cancel: (runId: string) =>
      backendClient.call("cancel_run_v1_runs__run_id__cancel_post", { pathParams: { run_id: runId } }),
    promote: (runId: string) =>
      invokeCatalogEndpoint({ method: "POST", path: "/v1/runs/{run_id}/promote", pathParams: { run_id: runId } }),
    artifacts: (runId: string) =>
      invokeCatalogEndpoint({ method: "GET", path: "/v1/runs/{run_id}/artifacts", pathParams: { run_id: runId } }),
  },

  ide: {
    actions: () => backendClient.call("ide_actions_v1_ide_actions_get"),
    analytics: () => backendClient.call("ide_analytics_v1_ide_analytics_get"),
    feedback: (body: Record<string, unknown>) => backendClient.call("ide_feedback_v1_ide_feedback_post", { body }),
    governancePolicies: () => backendClient.call("ide_governance_policies_v1_ide_governance_policies_get"),
    jobStatus: (jobId: string) => backendClient.call("ide_job_status_v1_ide_jobs__job_id__get", { pathParams: { job_id: jobId } }),
    jobEvents: (jobId: string, ticket?: string) =>
      backendClient.call("ide_job_events_v1_ide_jobs__job_id__events_get", { pathParams: { job_id: jobId }, query: { ticket } }),
  },
};
