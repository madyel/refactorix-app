export interface CopilotSettings {
  apiBaseUrl?: string;
  apiToken?: string;
  apiKey?: string;
}

export const COPILOT_SETTINGS_STORAGE_KEY = "copilot_settings";

const isBrowser = typeof window !== "undefined";

const normalizeUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().replace(/\/$/, "");
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeToken = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const sanitizeSettings = (value: Partial<CopilotSettings>): CopilotSettings => ({
  apiBaseUrl: normalizeUrl(value.apiBaseUrl),
  apiToken: normalizeToken(value.apiToken),
  apiKey: normalizeToken(value.apiKey),
});

export const loadCopilotSettings = (): CopilotSettings => {
  if (!isBrowser) return {};

  const raw = window.localStorage.getItem(COPILOT_SETTINGS_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Partial<CopilotSettings>;
    return sanitizeSettings(parsed);
  } catch {
    return {};
  }
};

export const saveCopilotSettings = (next: Partial<CopilotSettings>): CopilotSettings => {
  const settings = sanitizeSettings(next);

  if (isBrowser) {
    window.localStorage.setItem(COPILOT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  return settings;
};

export const getCopilotApiBaseUrl = (): string | undefined => loadCopilotSettings().apiBaseUrl;
export const getCopilotApiToken = (): string | undefined => loadCopilotSettings().apiToken;

export const getCopilotApiKey = (): string | undefined => loadCopilotSettings().apiKey;
