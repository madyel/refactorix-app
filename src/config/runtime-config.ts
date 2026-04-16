import { getCopilotApiBaseUrl, loadCopilotSettings, saveCopilotSettings } from "@/features/copilot/settings";

export const getRuntimeApiBaseUrl = (): string | undefined => getCopilotApiBaseUrl();

export const setRuntimeApiBaseUrl = (value: string): string => {
  const current = loadCopilotSettings();
  const updated = saveCopilotSettings({ ...current, apiBaseUrl: value });
  return updated.apiBaseUrl ?? "";
};

export const getConfiguredApiBaseUrl = (): string =>
  getRuntimeApiBaseUrl() ?? (import.meta.env.VITE_API_BASE_URL ?? "");
