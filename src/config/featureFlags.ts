const parseFlag = (value: string | undefined, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return value === "1" || value.toLowerCase() === "true";
};

export const featureFlags = {
  copilotEnabled: parseFlag(import.meta.env.VITE_COPILOT_ENABLED, true),
  copilotApplyPatchEnabled: parseFlag(import.meta.env.VITE_COPILOT_APPLY_PATCH_ENABLED, false),
  copilotCommitEnabled: parseFlag(import.meta.env.VITE_COPILOT_COMMIT_ENABLED, false),
};
