import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { loadCopilotSettings, probeCopilotConnection, saveCopilotSettings } from "@/features/copilot/settings";
import { bootstrapAuthSession, clearAuthSession, getValidAccessToken, loadAuthSession, refreshAuthSession } from "@/features/copilot/auth-session";
import { copilotClient } from "@/features/copilot/client";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const initial = useMemo(() => loadCopilotSettings(), []);
  const [apiBaseUrl, setApiBaseUrl] = useState(initial.apiBaseUrl ?? "");
  const [apiToken, setApiToken] = useState(initial.apiToken ?? "");
  const [apiKey, setApiKey] = useState(initial.apiKey ?? "");
  const [bootstrapRole, setBootstrapRole] = useState(initial.bootstrapRole ?? "operator");
  const [bootstrapSubject, setBootstrapSubject] = useState(initial.bootstrapSubject ?? "smart-ide");
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<string>("");
  const [sessionInfo, setSessionInfo] = useState(() => loadAuthSession());
  const [sessionMessage, setSessionMessage] = useState("");
  const [telemetrySnapshot, setTelemetrySnapshot] = useState(() => copilotClient.getTelemetrySnapshot());

  const handleSave = () => {
    const savedSettings = saveCopilotSettings({ apiBaseUrl, apiToken, apiKey, bootstrapRole, bootstrapSubject });
    setSaveMessage(savedSettings.apiBaseUrl ? `Base URL attiva: ${savedSettings.apiBaseUrl}` : "Base URL non valida o vuota: sarà usato il fallback runtime.");
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleConnectionTest = async () => {
    const savedSettings = saveCopilotSettings({ apiBaseUrl, apiToken, apiKey, bootstrapRole, bootstrapSubject });
    const sessionToken = await getValidAccessToken();
    const session = loadAuthSession();
    setSessionInfo(session);

    setIsTestingConnection(true);
    setConnectionResult("Testing...");

    const result = await probeCopilotConnection({
      apiBaseUrl: savedSettings.apiBaseUrl,
      apiKey: savedSettings.apiKey,
      apiToken: sessionToken ?? savedSettings.apiToken,
    });

    let authMeLine = "⚠️ /v1/auth/me · saltato (nessun access token disponibile)";
    if (savedSettings.apiBaseUrl && sessionToken) {
      try {
        const authMeResponse = await fetch(`${savedSettings.apiBaseUrl}/v1/auth/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${sessionToken}` },
        });
        authMeLine = `${authMeResponse.ok ? "✅" : "❌"} /v1/auth/me · ${authMeResponse.ok ? "OK" : `HTTP ${authMeResponse.status}`}${authMeResponse.status ? ` (${authMeResponse.status})` : ""}`;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Network error";
        authMeLine = `❌ /v1/auth/me · ${message}`;
      }
    }

    const lines = [
      `Base URL: ${result.baseUrl ?? "(invalid)"}`,
      ...result.probes.map((probe) => `${probe.ok ? "✅" : "❌"} ${probe.endpoint} · ${probe.message}${probe.status ? ` (${probe.status})` : ""}`),
      authMeLine,
    ];

    setConnectionResult(lines.join("\n"));
    setTelemetrySnapshot(copilotClient.getTelemetrySnapshot());
    setIsTestingConnection(false);
  };

  const handleBootstrapSession = async () => {
    handleSave();
    try {
      const session = await bootstrapAuthSession();
      setSessionInfo(session);
      setSessionMessage(session ? "Sessione bootstrap creata con successo." : "Bootstrap non riuscito: verifica API key/endpoint.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore bootstrap sessione.";
      setSessionMessage(message);
      setSessionInfo(loadAuthSession());
    }
  };

  const handleRefreshSession = async () => {
    try {
      const session = await refreshAuthSession();
      setSessionInfo(session);
      setSessionMessage(session ? "Refresh sessione completato." : "Refresh non riuscito: nessuna sessione valida.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore refresh sessione.";
      setSessionMessage(message);
      setSessionInfo(loadAuthSession());
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setSessionInfo(null);
    setSessionMessage("Sessione locale rimossa.");
  };

  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-6">
        <h1 className="text-2xl font-semibold">Settings · Copilot</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configura endpoint e token API in un'unica pagina dedicata. Queste impostazioni sono usate dal client FE.
        </p>

        <div className="mt-6 space-y-2">
          <Label htmlFor="theme-select">Tema applicazione</Label>
          <Select value={theme ?? "system"} onValueChange={setTheme}>
            <SelectTrigger id="theme-select" className="w-full sm:w-64">
              <SelectValue placeholder="Seleziona tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Sistema (predefinito)</SelectItem>
              <SelectItem value="light">Chiaro</SelectItem>
              <SelectItem value="dark">Scuro</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Con il tema di sistema, l&apos;app segue automaticamente le preferenze del sistema operativo.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Copilot API Base URL</label>
            <input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" placeholder="https://copilot.example.com" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Copilot API Key (bootstrap)</label>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" placeholder="api-key-..." type="password" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Bootstrap role</label>
              <input value={bootstrapRole} onChange={(e) => setBootstrapRole(e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Bootstrap subject</label>
              <input value={bootstrapSubject} onChange={(e) => setBootstrapSubject(e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Manual access token override (opzionale)</label>
            <input value={apiToken} onChange={(e) => setApiToken(e.target.value)} className="w-full rounded border bg-background px-3 py-2 text-sm" placeholder="sk-..." type="password" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={handleSave} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Salva configurazione</button>
          <button onClick={handleConnectionTest} className="rounded border px-4 py-2 text-sm hover:bg-muted disabled:opacity-60" disabled={isTestingConnection}>
            {isTestingConnection ? "Testing..." : "Test connessione Copilot"}
          </button>
          {saved && <span className="text-xs text-emerald-400">Salvato</span>}
          {saveMessage && <span className="text-xs text-muted-foreground">{saveMessage}</span>}
        </div>

        <div className="mt-6 rounded border bg-background p-3 text-xs">
          <div className="mb-2 font-medium">Sessione automatica token</div>
          <div className="mb-2 text-muted-foreground">
            {sessionInfo
              ? `Access token attivo${sessionInfo.expiresAt ? ` · scade: ${new Date(sessionInfo.expiresAt).toLocaleString()}` : ""} · refresh token: ${sessionInfo.refreshToken ? "presente" : "assente"}`
              : "Nessuna sessione attiva"}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleBootstrapSession} className="rounded border px-3 py-1.5 hover:bg-muted">Avvia sessione (bootstrap)</button>
            <button onClick={handleRefreshSession} className="rounded border px-3 py-1.5 hover:bg-muted">Refresh token</button>
            <button onClick={handleLogout} className="rounded border border-red-400/30 px-3 py-1.5 text-red-300 hover:bg-red-500/10">Logout locale</button>
          </div>
          {sessionMessage && <div className="mt-2 text-muted-foreground">{sessionMessage}</div>}
        </div>


        <div className="mt-6 rounded border bg-background p-3 text-xs">
          <div className="mb-2 flex items-center justify-between font-medium">
            <span>Copilot Telemetry (client)</span>
            <button
              onClick={() => setTelemetrySnapshot(copilotClient.getTelemetrySnapshot())}
              className="rounded border px-2 py-1 text-[11px] hover:bg-muted"
            >
              Aggiorna
            </button>
          </div>
          <div className="grid gap-1 text-muted-foreground">
            <div>Totale chiamate: {telemetrySnapshot.totalCalls}</div>
            <div>Error rate: {telemetrySnapshot.totalCalls > 0 ? `${Math.round((telemetrySnapshot.failedCalls / telemetrySnapshot.totalCalls) * 100)}%` : "0%"}</div>
            <div>Latenza media: {Math.round(telemetrySnapshot.averageLatencyMs)} ms</div>
            <div>
              Funnel analyze → patch → commit: {telemetrySnapshot.funnel.analyze} → {telemetrySnapshot.funnel.patch_generated} → {telemetrySnapshot.funnel.commit}
            </div>
            <div className="text-muted-foreground/70">Ultimo aggiornamento: {telemetrySnapshot.updatedAt ? new Date(telemetrySnapshot.updatedAt).toLocaleString() : "n/d"}</div>
          </div>
        </div>

        {connectionResult && (
          <pre className="mt-4 overflow-auto rounded border bg-muted p-3 text-xs">{connectionResult}</pre>
        )}

        <div className="mt-6 flex gap-3">
          <Link to="/" className="rounded border px-3 py-2 text-sm hover:bg-muted">Torna a App</Link>
          <Link to="/project-viewer" className="rounded border px-3 py-2 text-sm hover:bg-muted">Apri IDE</Link>
        </div>
      </section>
    </main>
  );
};

export default Settings;
