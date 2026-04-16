import { getCopilotApiBaseUrl, loadCopilotSettings, saveCopilotSettings } from "@/features/copilot/settings";

const isBrowser = typeof window !== "undefined";

const getDefaultApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  if (isBrowser && window.location.protocol === "file:") {
    return "http://localhost:8000";
  }

  return "";
};

export const getRuntimeApiBaseUrl = (): string | undefined => getCopilotApiBaseUrl();

export const setRuntimeApiBaseUrl = (value: string): string => {
  const current = loadCopilotSettings();
  const updated = saveCopilotSettings({ ...current, apiBaseUrl: value });
  return updated.apiBaseUrl ?? "";
};

export const getConfiguredApiBaseUrl = (): string =>
  getRuntimeApiBaseUrl() ?? getDefaultApiBaseUrl();
