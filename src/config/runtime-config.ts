const API_BASE_URL_STORAGE_KEY = "copilot_api_base_url";

const isBrowser = typeof window !== "undefined";

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/$/, "");

export const getRuntimeApiBaseUrl = (): string | undefined => {
  if (!isBrowser) return undefined;
  const value = window.localStorage.getItem(API_BASE_URL_STORAGE_KEY);
  if (!value) return undefined;
  const normalized = normalizeBaseUrl(value);
  return normalized.length > 0 ? normalized : undefined;
};

export const setRuntimeApiBaseUrl = (value: string): string => {
  const normalized = normalizeBaseUrl(value);

  if (isBrowser) {
    if (normalized.length === 0) {
      window.localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
    } else {
      window.localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized);
    }
  }

  return normalized;
};

export const getConfiguredApiBaseUrl = (): string =>
  getRuntimeApiBaseUrl() ?? (import.meta.env.VITE_API_BASE_URL ?? "");
