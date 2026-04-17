export interface CopilotSettings {
  apiBaseUrl?: string;
  apiToken?: string;
  apiKey?: string;
  bootstrapRole?: string;
  bootstrapSubject?: string;
}

export interface CopilotConnectionProbe {
  endpoint: string;
  ok: boolean;
  status?: number;
  message: string;
}

export interface CopilotConnectionResult {
  ok: boolean;
  baseUrl?: string;
  probes: CopilotConnectionProbe[];
}

export const COPILOT_SETTINGS_STORAGE_KEY = "copilot_settings";

const isBrowser = typeof window !== "undefined";

const ensureProtocol = (value: string): string => {
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)(:\d+)?/i.test(value)) {
    return `http://${value}`;
  }
  return value;
};

const normalizeUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  const maybeUrl = ensureProtocol(value.trim().replace(/\/$/, ""));

  try {
    const parsed = new URL(maybeUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
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
  bootstrapRole: normalizeToken(value.bootstrapRole) ?? "operator",
  bootstrapSubject: normalizeToken(value.bootstrapSubject) ?? "smart-ide",
});


const probeTimeoutMs = 8000;

const classifyNetworkError = async (baseUrl: string, endpoint: string, originalMessage: string) => {
  if (isBrowser && window.location.protocol === "https:" && baseUrl.startsWith("http://")) {
    return `${originalMessage} · Probabile mixed-content (pagina HTTPS -> API HTTP bloccata dal browser).`;
  }

  try {
    await fetch(`${baseUrl}${endpoint}`, { method: "GET", mode: "no-cors" });
    return `${originalMessage} · Endpoint raggiungibile ma probabilmente bloccato da CORS.`;
  } catch {
    return `${originalMessage} · Verifica rete/VPN/firewall e che l'API sia in ascolto su ${baseUrl}.`;
  }
};

const buildAuthHeaders = (settings: CopilotSettings): HeadersInit => ({
  ...(settings.apiToken ? { Authorization: `Bearer ${settings.apiToken}` } : {}),
  ...(settings.apiKey ? { "x-api-key": settings.apiKey } : {}),
});

const probe = async (baseUrl: string, endpoint: string, headers: HeadersInit): Promise<CopilotConnectionProbe> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), probeTimeoutMs);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        endpoint,
        ok: false,
        status: response.status,
        message: `HTTP ${response.status}`,
      };
    }

    return {
      endpoint,
      ok: true,
      status: response.status,
      message: "OK",
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Network error";
    const message = await classifyNetworkError(baseUrl, endpoint, rawMessage);

    return {
      endpoint,
      ok: false,
      message,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const probeCopilotConnection = async (candidate: Partial<CopilotSettings>): Promise<CopilotConnectionResult> => {
  const settings = sanitizeSettings(candidate);

  if (!settings.apiBaseUrl) {
    return {
      ok: false,
      probes: [
        {
          endpoint: "(config)",
          ok: false,
          message: "Base URL non valida o assente.",
        },
      ],
    };
  }

  const headers = buildAuthHeaders(settings);
  const probes = await Promise.all([
    probe(settings.apiBaseUrl, "/health", headers),
    probe(settings.apiBaseUrl, "/v1/system/ollama/status", headers),
  ]);

  return {
    ok: probes.every((item) => item.ok),
    baseUrl: settings.apiBaseUrl,
    probes,
  };
};

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

