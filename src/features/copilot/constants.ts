import type { CopilotMode, SessionRole } from "./types";

export const COPILOT_MODE_OPTIONS: CopilotMode[] = ["analyze", "dry_run", "apply_patch", "commit"];
export const COPILOT_ROLE_OPTIONS: SessionRole[] = ["guest", "operator", "reviewer", "admin"];

export const COPILOT_DEFAULTS = {
  repo: ".",
  role: "operator" as SessionRole,
  pollIntervalMs: 1200,
  pollMaxAttempts: 20,
  auditTrailLimit: 100,
};

export const COPILOT_STORAGE_KEYS = {
  apiBaseUrl: "copilot_api_base_url",
};
