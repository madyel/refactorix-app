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
  const accessToken =
    (payload.access_token as string | undefined) ??
    (payload.token as string | undefined) ??
    (payload.accessToken as string | undefined);

  if (!accessToken) return null;

  const expiresIn =
    (payload.expires_in as number | undefined) ??
    (payload.expiresIn as number | undefined) ??
    undefined;

  return {
    accessToken,
    refreshToken:
      (payload.refresh_token as string | undefined) ??
      (payload.refreshToken as string | undefined) ??
      undefined,
    tokenType: (payload.token_type as string | undefined) ?? "Bearer",
    expiresAt: expiresIn ? now() + expiresIn * 1000 : undefined,
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

export const bootstrapAuthSession = async (): Promise<AuthSession | null> => {
  const settings = loadCopilotSettings();
  if (!settings.apiBaseUrl || !settings.apiKey) return null;

  const role = settings.bootstrapRole ?? "operator";
  const subject = settings.bootstrapSubject ?? "smart-ide";

  try {
    const payload = await requestWithHeaders(
      settings.apiBaseUrl,
      "/v1/auth/session/token",
      {
        method: "POST",
        body: JSON.stringify({ role, subject }),
      },
      { "x-api-key": settings.apiKey },
    );
    const session = parseTokenResponse(payload);
    if (session) {
      saveAuthSession(session);
      return session;
    }
  } catch {
    // fallback query-style contract
  }

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
    return null;
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
          body: JSON.stringify({
            refresh_token: current.refreshToken,
            refreshToken: current.refreshToken,
          }),
        },
        settings.apiKey ? { "x-api-key": settings.apiKey } : {},
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

  return bootstrapAuthSession();
};

export const getValidAccessToken = async (): Promise<string | null> => {
  let session = loadAuthSession();

  if (!session) {
    session = await bootstrapAuthSession();
  }

  if (shouldRefresh(session)) {
    if (!inFlightRefresh) {
      inFlightRefresh = refreshAuthSession().finally(() => {
        inFlightRefresh = null;
      });
    }
    session = await inFlightRefresh;
  }

  return session?.accessToken ?? null;
};

export const refreshAfterUnauthorized = async (): Promise<string | null> => {
  if (!inFlightRefresh) {
    inFlightRefresh = refreshAuthSession().finally(() => {
      inFlightRefresh = null;
    });
  }
  const session = await inFlightRefresh;
  return session?.accessToken ?? null;
};
