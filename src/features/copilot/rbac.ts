import type { CopilotMode, SessionRole } from "./types";

const roleWeight: Record<SessionRole, number> = {
  guest: 0,
  operator: 1,
  reviewer: 2,
  admin: 3,
};

const modeRoleRequirement: Record<CopilotMode, SessionRole> = {
  analyze: "guest",
  dry_run: "operator",
  apply_patch: "reviewer",
  commit: "admin",
};

export const canRunMode = (role: SessionRole, mode: CopilotMode): boolean =>
  roleWeight[role] >= roleWeight[modeRoleRequirement[mode]];

export const isHighRiskMode = (mode: CopilotMode): boolean => mode === "apply_patch" || mode === "commit";
