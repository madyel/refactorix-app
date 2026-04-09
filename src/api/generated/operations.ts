/* AUTO-GENERATED from src/resources/openapi.json. */
import type {
  AIDevRequest,
  AIDevResponse,
  ContextPlanRequest,
  FeedbackRequest,
  IDEActionsResponse,
  IDEBatchRunRequest,
  IDEFeedbackRequest,
  PentestRunRequest,
  PentestRunResponse,
  ProjectCreateRequest,
  ProjectGenerateRequest,
  SecurityAssessmentRequest,
  SecurityAssessmentResponse,
} from "../schemas";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OperationContract<TMethod extends HttpMethod, TPath extends string, TRequest, TResponse, TPathParams, TQuery> {
  method: TMethod;
  path: TPath;
  requestBody: TRequest;
  response: TResponse;
  pathParams: TPathParams;
  query: TQuery;
}

export interface ApiOperations {
  "root__get": OperationContract<"GET", "/", never, Record<string, unknown>, undefined, undefined>;
  "health_health_get": OperationContract<"GET", "/health", never, Record<string, unknown>, undefined, undefined>;
  "readiness_ready_get": OperationContract<"GET", "/ready", never, Record<string, unknown>, undefined, undefined>;
  "metrics_metrics_get": OperationContract<"GET", "/metrics", never, unknown, undefined, undefined>;
  "copilot_copilot_get": OperationContract<"GET", "/copilot", never, unknown, undefined, undefined>;
  "ollama_status_v1_system_ollama_status_get": OperationContract<"GET", "/v1/system/ollama/status", never, Record<string, unknown>, undefined, undefined>;
  "ollama_select_model_v1_system_ollama_select_model_post": OperationContract<"POST", "/v1/system/ollama/select-model", Record<string, unknown>, Record<string, unknown>, undefined, undefined>;
  "qdrant_status_v1_system_qdrant_status_get": OperationContract<"GET", "/v1/system/qdrant/status", never, Record<string, unknown>, undefined, undefined>;
  "temporal_status_v1_system_temporal_status_get": OperationContract<"GET", "/v1/system/temporal/status", never, Record<string, unknown>, undefined, undefined>;
  "workflow_golden_path_v1_system_workflow_golden_path_get": OperationContract<"GET", "/v1/system/workflow/golden-path", never, Record<string, unknown>, undefined, undefined>;
  "audit_verify_v1_system_audit_verify_get": OperationContract<"GET", "/v1/system/audit/verify", never, Record<string, unknown>, undefined, undefined>;
  "issue_token_v1_auth_token_post": OperationContract<"POST", "/v1/auth/token", never, Record<string, unknown>, undefined, { role?: string; subject?: string }>;
  "revoke_current_token_v1_auth_revoke_post": OperationContract<"POST", "/v1/auth/revoke", never, Record<string, unknown>, undefined, { reason?: string }>;
  "revocation_store_stats_v1_auth_revocation_stats_get": OperationContract<"GET", "/v1/auth/revocation/stats", never, Record<string, unknown>, undefined, undefined>;
  "who_am_i_v1_auth_me_get": OperationContract<"GET", "/v1/auth/me", never, Record<string, unknown>, undefined, undefined>;
  "session_login_v1_auth_session_login_post": OperationContract<"POST", "/v1/auth/session/login", never, Record<string, unknown>, undefined, { role?: string; subject?: string }>;
  "session_logout_v1_auth_session_logout_post": OperationContract<"POST", "/v1/auth/session/logout", never, Record<string, unknown>, undefined, undefined>;
  "session_me_v1_auth_session_me_get": OperationContract<"GET", "/v1/auth/session/me", never, Record<string, unknown>, undefined, undefined>;
  "list_runs_v1_runs_get": OperationContract<"GET", "/v1/runs", never, Record<string, unknown>[], undefined, { limit?: number }>;
  "get_run_v1_runs__run_id__get": OperationContract<"GET", "/v1/runs/{run_id}", never, Record<string, unknown>, { run_id: string }, undefined>;
  "get_run_result_v1_runs__run_id__result_get": OperationContract<"GET", "/v1/runs/{run_id}/result", never, Record<string, unknown>, { run_id: string }, undefined>;
  "cancel_run_v1_runs__run_id__cancel_post": OperationContract<"POST", "/v1/runs/{run_id}/cancel", never, Record<string, unknown>, { run_id: string }, undefined>;
  "queue_stats_v1_runs_queue_stats_get": OperationContract<"GET", "/v1/runs/queue/stats", never, Record<string, unknown>, undefined, undefined>;
  "queue_dlq_v1_runs_queue_dlq_get": OperationContract<"GET", "/v1/runs/queue/dlq", never, Record<string, unknown>, undefined, { limit?: number }>;
  "queue_dlq_requeue_v1_runs_queue_dlq__dlq_id__requeue_post": OperationContract<"POST", "/v1/runs/queue/dlq/{dlq_id}/requeue", never, Record<string, unknown>, { dlq_id: number }, undefined>;
  "queue_telemetry_v1_runs_queue_telemetry_get": OperationContract<"GET", "/v1/runs/queue/telemetry", never, Record<string, unknown>, undefined, undefined>;
  "queue_remediate_stale_v1_runs_queue_remediate_stale_post": OperationContract<"POST", "/v1/runs/queue/remediate/stale", never, Record<string, unknown>, undefined, { stale_before_seconds?: number }>;
  "run_events_v1_runs__run_id__events_get": OperationContract<"GET", "/v1/runs/{run_id}/events", never, unknown, { run_id: string }, undefined>;
  "create_project_endpoint_v1_projects_create_post": OperationContract<"POST", "/v1/projects/create", ProjectCreateRequest, Record<string, unknown>, undefined, undefined>;
  "generate_project_code_endpoint_v1_projects_generate_post": OperationContract<"POST", "/v1/projects/generate", ProjectGenerateRequest, Record<string, unknown>, undefined, undefined>;
  "discover_projects_v1_projects_discovery_get": OperationContract<"GET", "/v1/projects/discovery", never, Record<string, unknown>, undefined, undefined>;
  "project_tree_v1_projects_tree_get": OperationContract<"GET", "/v1/projects/tree", never, Record<string, unknown>, undefined, { project_path: string; depth?: number }>;
  "context_plan_v1_projects_context_plan_post": OperationContract<"POST", "/v1/projects/context-plan", ContextPlanRequest, Record<string, unknown>, undefined, undefined>;
  "add_feedback_v1_learning_feedback_post": OperationContract<"POST", "/v1/learning/feedback", FeedbackRequest, Record<string, unknown>, undefined, undefined>;
  "learning_policy_v1_learning_policy_get": OperationContract<"GET", "/v1/learning/policy", never, Record<string, unknown>, undefined, undefined>;
  "learning_status_v1_learning_status_get": OperationContract<"GET", "/v1/learning/status", never, Record<string, unknown>, undefined, undefined>;
  "refresh_policy_v1_learning_refresh_policy_post": OperationContract<"POST", "/v1/learning/refresh-policy", never, Record<string, unknown>, undefined, undefined>;
  "learning_quality_gates_v1_learning_quality_gates_get": OperationContract<"GET", "/v1/learning/quality-gates", never, Record<string, unknown>, undefined, undefined>;
  "export_learning_dataset_v1_learning_export_dataset_post": OperationContract<"POST", "/v1/learning/export-dataset", never, Record<string, unknown>, undefined, { output_path?: string | null }>;
  "security_authorization_banner_v1_security_banner_get": OperationContract<"GET", "/v1/security/banner", never, Record<string, unknown>, undefined, undefined>;
  "security_assess_v1_security_assess_post": OperationContract<"POST", "/v1/security/assess", SecurityAssessmentRequest, SecurityAssessmentResponse, undefined, undefined>;
  "security_assessment_details_v1_security_assessments__assessment_run_id__get": OperationContract<"GET", "/v1/security/assessments/{assessment_run_id}", never, Record<string, unknown>, { assessment_run_id: string }, undefined>;
  "security_assessment_export_v1_security_assessments__assessment_run_id__export_get": OperationContract<"GET", "/v1/security/assessments/{assessment_run_id}/export", never, unknown, { assessment_run_id: string }, { format?: string }>;
  "security_intelligence_v1_security_intelligence_status_get": OperationContract<"GET", "/v1/security/intelligence/status", never, Record<string, unknown>, undefined, undefined>;
  "security_dashboard_v1_security_intelligence_dashboard_get": OperationContract<"GET", "/v1/security/intelligence/dashboard", never, Record<string, unknown>, undefined, undefined>;
  "security_reindex_v1_security_admin_reindex_post": OperationContract<"POST", "/v1/security/admin/reindex", Record<string, unknown> | null, Record<string, unknown>, undefined, undefined>;
  "security_sync_feeds_v1_security_admin_sync_feeds_post": OperationContract<"POST", "/v1/security/admin/sync-feeds", Record<string, unknown> | null, Record<string, unknown>, undefined, undefined>;
  "security_outcomes_v1_security_outcomes_post": OperationContract<"POST", "/v1/security/outcomes", Record<string, unknown>, Record<string, unknown>, undefined, undefined>;
  "security_system_of_record_v1_security_intelligence_system_of_record_get": OperationContract<"GET", "/v1/security/intelligence/system-of-record", never, Record<string, unknown>, undefined, { tenant_id: string }>;
  "security_compact_v1_security_admin_compact_post": OperationContract<"POST", "/v1/security/admin/compact", Record<string, unknown> | null, Record<string, unknown>, undefined, undefined>;
  "security_bootstrap_history_v1_security_admin_bootstrap_history_post": OperationContract<"POST", "/v1/security/admin/bootstrap-history", Record<string, unknown>, Record<string, unknown>, undefined, undefined>;
  "security_ai_evaluate_v1_security_ai_evaluate_models_post": OperationContract<"POST", "/v1/security/ai/evaluate-models", Record<string, unknown>, Record<string, unknown>, undefined, undefined>;
  "security_pentest_run_v1_security_pentest_run_post": OperationContract<"POST", "/v1/security/pentest/run", PentestRunRequest, PentestRunResponse, undefined, undefined>;
  "security_pentest_review_v1_security_pentest_review_post": OperationContract<"POST", "/v1/security/pentest/review", Record<string, unknown>, Record<string, unknown>, undefined, undefined>;
  "security_pentest_reviews_v1_security_pentest_reviews_get": OperationContract<"GET", "/v1/security/pentest/reviews", never, Record<string, unknown>, undefined, { run_id?: string | null; owner?: string | null; state?: string | null }>;
  "ai_dev_v1_v1_ai_dev_post": OperationContract<"POST", "/v1/ai-dev", AIDevRequest, AIDevResponse, undefined, undefined>;
  "ai_dev_async_v1_ai_dev_async_post": OperationContract<"POST", "/v1/ai-dev/async", AIDevRequest, Record<string, unknown>, undefined, undefined>;
  "ide_actions_v1_ide_actions_get": OperationContract<"GET", "/v1/ide/actions", never, IDEActionsResponse, undefined, undefined>;
  "ide_batch_run_v1_ide_batch_run_post": OperationContract<"POST", "/v1/ide/batch/run", IDEBatchRunRequest, Record<string, unknown>, undefined, undefined>;
  "ide_job_status_v1_ide_jobs__job_id__get": OperationContract<"GET", "/v1/ide/jobs/{job_id}", never, Record<string, unknown>, { job_id: string }, undefined>;
  "ide_job_events_v1_ide_jobs__job_id__events_get": OperationContract<"GET", "/v1/ide/jobs/{job_id}/events", never, unknown, { job_id: string }, { ticket?: string | null }>;
  "ide_sse_ticket_v1_ide_jobs__job_id__events_ticket_post": OperationContract<"POST", "/v1/ide/jobs/{job_id}/events/ticket", never, Record<string, unknown>, { job_id: string }, undefined>;
  "ide_feedback_v1_ide_feedback_post": OperationContract<"POST", "/v1/ide/feedback", IDEFeedbackRequest, Record<string, unknown>, undefined, undefined>;
  "ide_analytics_v1_ide_analytics_get": OperationContract<"GET", "/v1/ide/analytics", never, Record<string, unknown>, undefined, undefined>;
  "ide_governance_policies_v1_ide_governance_policies_get": OperationContract<"GET", "/v1/ide/governance/policies", never, Record<string, unknown>, undefined, undefined>;
  "ide_governance_create_policy_v1_ide_governance_policies_post": OperationContract<"POST", "/v1/ide/governance/policies", Record<string, unknown>, Record<string, unknown>, undefined, undefined>;
  "ide_governance_update_policy_v1_ide_governance_policies__version__patch": OperationContract<"PATCH", "/v1/ide/governance/policies/{version}", Record<string, unknown>, Record<string, unknown>, { version: number }, undefined>;
  "ide_governance_delete_policy_v1_ide_governance_policies__version__delete": OperationContract<"DELETE", "/v1/ide/governance/policies/{version}", never, Record<string, unknown>, { version: number }, undefined>;
  "ide_governance_approve_policy_v1_ide_governance_policies__version__approve_post": OperationContract<"POST", "/v1/ide/governance/policies/{version}/approve", never, Record<string, unknown>, { version: number }, undefined>;
}

export const apiOperations: { [K in keyof ApiOperations]: Pick<ApiOperations[K], "method" | "path"> } = {
  "root__get": { method: "GET", path: "/" },
  "health_health_get": { method: "GET", path: "/health" },
  "readiness_ready_get": { method: "GET", path: "/ready" },
  "metrics_metrics_get": { method: "GET", path: "/metrics" },
  "copilot_copilot_get": { method: "GET", path: "/copilot" },
  "ollama_status_v1_system_ollama_status_get": { method: "GET", path: "/v1/system/ollama/status" },
  "ollama_select_model_v1_system_ollama_select_model_post": { method: "POST", path: "/v1/system/ollama/select-model" },
  "qdrant_status_v1_system_qdrant_status_get": { method: "GET", path: "/v1/system/qdrant/status" },
  "temporal_status_v1_system_temporal_status_get": { method: "GET", path: "/v1/system/temporal/status" },
  "workflow_golden_path_v1_system_workflow_golden_path_get": { method: "GET", path: "/v1/system/workflow/golden-path" },
  "audit_verify_v1_system_audit_verify_get": { method: "GET", path: "/v1/system/audit/verify" },
  "issue_token_v1_auth_token_post": { method: "POST", path: "/v1/auth/token" },
  "revoke_current_token_v1_auth_revoke_post": { method: "POST", path: "/v1/auth/revoke" },
  "revocation_store_stats_v1_auth_revocation_stats_get": { method: "GET", path: "/v1/auth/revocation/stats" },
  "who_am_i_v1_auth_me_get": { method: "GET", path: "/v1/auth/me" },
  "session_login_v1_auth_session_login_post": { method: "POST", path: "/v1/auth/session/login" },
  "session_logout_v1_auth_session_logout_post": { method: "POST", path: "/v1/auth/session/logout" },
  "session_me_v1_auth_session_me_get": { method: "GET", path: "/v1/auth/session/me" },
  "list_runs_v1_runs_get": { method: "GET", path: "/v1/runs" },
  "get_run_v1_runs__run_id__get": { method: "GET", path: "/v1/runs/{run_id}" },
  "get_run_result_v1_runs__run_id__result_get": { method: "GET", path: "/v1/runs/{run_id}/result" },
  "cancel_run_v1_runs__run_id__cancel_post": { method: "POST", path: "/v1/runs/{run_id}/cancel" },
  "queue_stats_v1_runs_queue_stats_get": { method: "GET", path: "/v1/runs/queue/stats" },
  "queue_dlq_v1_runs_queue_dlq_get": { method: "GET", path: "/v1/runs/queue/dlq" },
  "queue_dlq_requeue_v1_runs_queue_dlq__dlq_id__requeue_post": { method: "POST", path: "/v1/runs/queue/dlq/{dlq_id}/requeue" },
  "queue_telemetry_v1_runs_queue_telemetry_get": { method: "GET", path: "/v1/runs/queue/telemetry" },
  "queue_remediate_stale_v1_runs_queue_remediate_stale_post": { method: "POST", path: "/v1/runs/queue/remediate/stale" },
  "run_events_v1_runs__run_id__events_get": { method: "GET", path: "/v1/runs/{run_id}/events" },
  "create_project_endpoint_v1_projects_create_post": { method: "POST", path: "/v1/projects/create" },
  "generate_project_code_endpoint_v1_projects_generate_post": { method: "POST", path: "/v1/projects/generate" },
  "discover_projects_v1_projects_discovery_get": { method: "GET", path: "/v1/projects/discovery" },
  "project_tree_v1_projects_tree_get": { method: "GET", path: "/v1/projects/tree" },
  "context_plan_v1_projects_context_plan_post": { method: "POST", path: "/v1/projects/context-plan" },
  "add_feedback_v1_learning_feedback_post": { method: "POST", path: "/v1/learning/feedback" },
  "learning_policy_v1_learning_policy_get": { method: "GET", path: "/v1/learning/policy" },
  "learning_status_v1_learning_status_get": { method: "GET", path: "/v1/learning/status" },
  "refresh_policy_v1_learning_refresh_policy_post": { method: "POST", path: "/v1/learning/refresh-policy" },
  "learning_quality_gates_v1_learning_quality_gates_get": { method: "GET", path: "/v1/learning/quality-gates" },
  "export_learning_dataset_v1_learning_export_dataset_post": { method: "POST", path: "/v1/learning/export-dataset" },
  "security_authorization_banner_v1_security_banner_get": { method: "GET", path: "/v1/security/banner" },
  "security_assess_v1_security_assess_post": { method: "POST", path: "/v1/security/assess" },
  "security_assessment_details_v1_security_assessments__assessment_run_id__get": { method: "GET", path: "/v1/security/assessments/{assessment_run_id}" },
  "security_assessment_export_v1_security_assessments__assessment_run_id__export_get": { method: "GET", path: "/v1/security/assessments/{assessment_run_id}/export" },
  "security_intelligence_v1_security_intelligence_status_get": { method: "GET", path: "/v1/security/intelligence/status" },
  "security_dashboard_v1_security_intelligence_dashboard_get": { method: "GET", path: "/v1/security/intelligence/dashboard" },
  "security_reindex_v1_security_admin_reindex_post": { method: "POST", path: "/v1/security/admin/reindex" },
  "security_sync_feeds_v1_security_admin_sync_feeds_post": { method: "POST", path: "/v1/security/admin/sync-feeds" },
  "security_outcomes_v1_security_outcomes_post": { method: "POST", path: "/v1/security/outcomes" },
  "security_system_of_record_v1_security_intelligence_system_of_record_get": { method: "GET", path: "/v1/security/intelligence/system-of-record" },
  "security_compact_v1_security_admin_compact_post": { method: "POST", path: "/v1/security/admin/compact" },
  "security_bootstrap_history_v1_security_admin_bootstrap_history_post": { method: "POST", path: "/v1/security/admin/bootstrap-history" },
  "security_ai_evaluate_v1_security_ai_evaluate_models_post": { method: "POST", path: "/v1/security/ai/evaluate-models" },
  "security_pentest_run_v1_security_pentest_run_post": { method: "POST", path: "/v1/security/pentest/run" },
  "security_pentest_review_v1_security_pentest_review_post": { method: "POST", path: "/v1/security/pentest/review" },
  "security_pentest_reviews_v1_security_pentest_reviews_get": { method: "GET", path: "/v1/security/pentest/reviews" },
  "ai_dev_v1_v1_ai_dev_post": { method: "POST", path: "/v1/ai-dev" },
  "ai_dev_async_v1_ai_dev_async_post": { method: "POST", path: "/v1/ai-dev/async" },
  "ide_actions_v1_ide_actions_get": { method: "GET", path: "/v1/ide/actions" },
  "ide_batch_run_v1_ide_batch_run_post": { method: "POST", path: "/v1/ide/batch/run" },
  "ide_job_status_v1_ide_jobs__job_id__get": { method: "GET", path: "/v1/ide/jobs/{job_id}" },
  "ide_job_events_v1_ide_jobs__job_id__events_get": { method: "GET", path: "/v1/ide/jobs/{job_id}/events" },
  "ide_sse_ticket_v1_ide_jobs__job_id__events_ticket_post": { method: "POST", path: "/v1/ide/jobs/{job_id}/events/ticket" },
  "ide_feedback_v1_ide_feedback_post": { method: "POST", path: "/v1/ide/feedback" },
  "ide_analytics_v1_ide_analytics_get": { method: "GET", path: "/v1/ide/analytics" },
  "ide_governance_policies_v1_ide_governance_policies_get": { method: "GET", path: "/v1/ide/governance/policies" },
  "ide_governance_create_policy_v1_ide_governance_policies_post": { method: "POST", path: "/v1/ide/governance/policies" },
  "ide_governance_update_policy_v1_ide_governance_policies__version__patch": { method: "PATCH", path: "/v1/ide/governance/policies/{version}" },
  "ide_governance_delete_policy_v1_ide_governance_policies__version__delete": { method: "DELETE", path: "/v1/ide/governance/policies/{version}" },
  "ide_governance_approve_policy_v1_ide_governance_policies__version__approve_post": { method: "POST", path: "/v1/ide/governance/policies/{version}/approve" },
};