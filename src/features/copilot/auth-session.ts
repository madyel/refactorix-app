import { loadCopilotSettings } from "./settings";

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt?: number;
}

const AUTH_SESSION_STORAGE_KEY = "copilot_auth_session";
const REFRESH_LEEWAY_MS = 60_000;

let inFlightRefresh: Promise<AuthSession | null> | null = null;

const isBrowser = typeof window !== "undefined";

const now = () => Date.now();

const parseTokenResponse = (payload: Record<string, unknown>): AuthSession | null => {
  const asRecord = (value: unknown): Record<string, unknown> | null =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : null;

  const root = payload;
  const nestedCandidates = [
    asRecord(payload.session),
    asRecord(payload.data),
    asRecord(asRecord(payload.data)?.session),
  ].filter((item): item is Record<string, unknown> => Boolean(item));

  const readFirst = (keys: string[]): unknown => {
    for (const key of keys) {
      if (key in root) return root[key];
      for (const nested of nestedCandidates) {
        if (key in nested) return nested[key];
      }
    }
    return undefined;
  };

  const accessToken =
    (readFirst(["access_token", "token", "accessToken"]) as string | undefined);

  if (!accessToken) return null;

  const expiresIn = readFirst(["expires_in", "expiresIn"]) as number | undefined;
  const expiresAtRaw =
    (readFirst(["expires_at", "expiresAt"]) as string | number | undefined);
  const expiresAtFromPayload =
    typeof expiresAtRaw === "number"
      ? expiresAtRaw
      : typeof expiresAtRaw === "string"
        ? new Date(expiresAtRaw).getTime()
        : undefined;

  return {
    accessToken,
    refreshToken:
      (readFirst(["refresh_token", "refreshToken"]) as string | undefined) ??
      undefined,
    tokenType: (readFirst(["token_type", "tokenType"]) as string | undefined) ?? "Bearer",
    expiresAt: Number.isFinite(expiresAtFromPayload) ? expiresAtFromPayload : expiresIn ? now() + expiresIn * 1000 : undefined,
  };
};

export const loadAuthSession = (): AuthSession | null => {
  if (!isBrowser) return null;
  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const saveAuthSession = (session: AuthSession | null) => {
  if (!isBrowser) return;
  if (!session) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => saveAuthSession(null);

const shouldRefresh = (session: AuthSession | null): boolean => {
  if (!session?.expiresAt) return false;
  return session.expiresAt - now() <= REFRESH_LEEWAY_MS;
};

const requestWithHeaders = async (
  baseUrl: string,
  path: string,
  init: RequestInit,
  headers: Record<string, string> = {},
): Promise<Record<string, unknown>> => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(init.headers as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    throw new Error(`Auth request failed (${response.status}) ${path}`);
  }

  return (await response.json()) as Record<string, unknown>;
};

const getCsrfToken = (): string | undefined => {
  if (!isBrowser) return undefined;
  const match = document.cookie.match(/(?:^|;\s*)ae_csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
};

export const bootstrapAuthSession = async (): Promise<AuthSession | null> => {
  const settings = loadCopilotSettings();
  if (!settings.apiBaseUrl || !settings.apiKey) return null;

  const role = settings.bootstrapRole ?? "operator";
  const subject = settings.bootstrapSubject ?? "smart-ide";

  try {
    const payload = await requestWithHeaders(
      settings.apiBaseUrl,
      `/v1/auth/session/token?role=${encodeURIComponent(role)}&subject=${encodeURIComponent(subject)}`,
      { method: "POST" },
      { "x-api-key": settings.apiKey },
    );
    const session = parseTokenResponse(payload);
    if (session) {
      saveAuthSession(session);
      return session;
    }
  } catch {
    // fallback cookie-based login flow for web UI
  }

  try {
    const payload = await requestWithHeaders(
      settings.apiBaseUrl,
      `/v1/auth/session/login?role=${encodeURIComponent(role)}&subject=${encodeURIComponent(subject)}`,
      { method: "POST", credentials: "include" },
      { "x-api-key": settings.apiKey },
    );
    const session = parseTokenResponse(payload);
    if (session) {
      saveAuthSession(session);
      return session;
    }
  } catch {
    throw new Error("Bootstrap sessione fallito: verifica endpoint /v1/auth/session/token o /v1/auth/session/login e x-api-key.");
  }

  return null;
};

export const refreshAuthSession = async (): Promise<AuthSession | null> => {
  const settings = loadCopilotSettings();
  const current = loadAuthSession();
  if (!settings.apiBaseUrl) return null;

  if (current?.refreshToken) {
    try {
      const payload = await requestWithHeaders(
        settings.apiBaseUrl,
        "/v1/auth/session/refresh",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${current.refreshToken}` },
        },
      );
      const refreshed = parseTokenResponse(payload);
      if (refreshed) {
        saveAuthSession(refreshed);
        return refreshed;
      }
    } catch {
      // fallback bootstrap
    }
  }

  try {
    const csrf = getCsrfToken();
    const payload = await requestWithHeaders(
      settings.apiBaseUrl,
      "/v1/auth/session/refresh",
      { method: "POST", credentials: "include" },
      csrf ? { "x-csrf-token": csrf } : {},
    );
    const refreshed = parseTokenResponse(payload);
    if (refreshed) {
      saveAuthSession(refreshed);
      return refreshed;
    }
  } catch {
    // fallback bootstrap
  }

  return bootstrapAuthSession();
};

export const getValidAccessToken = async (): Promise<string | null> => {
  let session = loadAuthSession();

  if (!session) {
    try {
      session = await bootstrapAuthSession();
    } catch {
      return null;
    }
  }

  if (shouldRefresh(session)) {
    if (!inFlightRefresh) {
      inFlightRefresh = refreshAuthSession().finally(() => {
        inFlightRefresh = null;
      });
    }
    try {
      session = await inFlightRefresh;
    } catch {
      return null;
    }
  }

  return session?.accessToken ?? null;
};

export const refreshAfterUnauthorized = async (): Promise<string | null> => {
  if (!inFlightRefresh) {
    inFlightRefresh = refreshAuthSession().finally(() => {
      inFlightRefresh = null;
    });
  }
  let session: AuthSession | null = null;
  try {
    session = await inFlightRefresh;
  } catch {
    return null;
  }
  return session?.accessToken ?? null;
};
