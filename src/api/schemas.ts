export interface AIDevRequest {
  task: string;
  repo: string;
  mode?: string;
  commit_message?: string | null;
  idempotency_key?: string | null;
  human_approved?: boolean;
}

export interface AIDevResponse {
  task: string;
  repo: string;
  mode: string;
  run_id: string;
  detected_language?: string | null;
  repository_summary?: Record<string, unknown> | null;
  architecture_analysis: Record<string, unknown>;
  candidate_files: string[];
  tooling?: Record<string, unknown> | null;
  security_layer?: Record<string, unknown> | null;
  orchestration?: Record<string, unknown> | null;
  patch_status: Record<string, unknown>;
  test_status: Record<string, unknown>;
  final_review: Record<string, unknown>;
  git_status: Record<string, unknown>;
  rag: Record<string, unknown>;
  plan: string[];
  contract: Record<string, unknown>;
  golden_path?: Record<string, unknown> | null;
  provable_fixes?: Record<string, unknown> | null;
}

export interface ContextPlanRequest {
  project_path: string;
  task: string;
  selected_files?: string[];
}

export interface ErrorResponse {
  error: Record<string, unknown>;
}

export interface FeedbackRequest {
  run_id: string;
  score: number;
  accepted?: boolean;
  notes?: string;
}

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface IDEActionDescriptor {
  name: string;
  kind: string;
  version: string;
  required_role: string;
  enabled?: boolean;
}

export interface IDEActionsResponse {
  ok: boolean;
  actions: IDEActionDescriptor[];
}

export interface IDEBatchAction {
  name: string;
  params?: Record<string, unknown>;
}

export interface IDEBatchRunRequest {
  workspace?: Record<string, unknown>;
  actions?: IDEBatchAction[];
}

export interface IDEFeedbackRequest {
  action: string;
  accepted: boolean;
  rating?: number | null;
  user_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PentestRunRequest {
  repo: string;
  target: string;
  isolated_runtime?: boolean;
  auth?: Record<string, unknown> | null;
  crawl_paths?: string[];
  telemetry_paths?: string[];
  waf_events?: Record<string, unknown>[];
  apm_events?: Record<string, unknown>[];
  telemetry_time_window_seconds?: number;
  rules_of_engagement?: Record<string, unknown> | null;
  lab_mode?: string;
  lab_compose_file?: string | null;
  lab_project_name?: string | null;
  lab_network_name?: string | null;
  lab_seed_commands?: string[];
  lab_namespace?: string | null;
  exploit_policy?: Record<string, unknown> | null;
  exploit_feeds?: Record<string, unknown> | null;
  reporting?: Record<string, unknown> | null;
  dast_profile?: string;
  dast_scanner?: string;
  dast_profile_override?: Record<string, unknown> | null;
  authorized_testing?: boolean;
}

export interface PentestRunResponse {
  ok: boolean;
  run_id?: string | null;
  state?: string | null;
  validation_required?: boolean | null;
  risk_score?: number | null;
  reports?: Record<string, unknown> | null;
  lab?: Record<string, unknown> | null;
  dast?: Record<string, unknown> | null;
  exploit?: Record<string, unknown> | null;
  telemetry?: Record<string, unknown> | null;
}

export interface ProjectCreateRequest {
  name: string;
  stack?: string;
  template?: string;
  path?: string;
  init_git?: boolean;
  install_deps?: boolean;
}

export interface ProjectGenerateRequest {
  repo_path: string;
  request: string;
}

export interface SecurityAssessmentRequest {
  repo?: string | null;
  target?: string | null;
  security_mode?: string;
  assessment_types?: string[];
  assessment_type?: string | null;
  authorized_testing?: boolean;
  update_baseline?: boolean;
  ai_assisted?: boolean | null;
}

export interface SecurityAssessmentResponse {
  assessment_run_id: string;
  security_mode: string;
  assessment_types: string[];
  target?: string | null;
  repo?: string | null;
  findings: Record<string, unknown>[];
  severity_summary: Record<string, unknown>;
  baseline_diff: Record<string, unknown>;
  quality_gate: Record<string, unknown>;
  cross_run_intelligence?: Record<string, unknown> | null;
  ai_assisted?: Record<string, unknown> | null;
  reporting?: Record<string, unknown> | null;
}
