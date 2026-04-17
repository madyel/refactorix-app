import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { loadCopilotSettings, probeCopilotConnection, saveCopilotSettings } from "@/features/copilot/settings";
import { bootstrapAuthSession, clearAuthSession, getValidAccessToken, loadAuthSession, refreshAuthSession } from "@/features/copilot/auth-session";

const Settings = () => {
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
    const lines = [
      `Base URL: ${result.baseUrl ?? "(invalid)"}`,
      ...result.probes.map((probe) => `${probe.ok ? "✅" : "❌"} ${probe.endpoint} · ${probe.message}${probe.status ? ` (${probe.status})` : ""}`),
    ];

    setConnectionResult(lines.join("\n"));
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
    <main className="min-h-screen bg-[#1b1b1b] p-6 text-slate-100">
      <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-black/20 p-6">
        <h1 className="text-2xl font-semibold">Settings · Copilot</h1>
        <p className="mt-2 text-sm text-slate-300">
          Configura endpoint e token API in un'unica pagina dedicata. Queste impostazioni sono usate dal client FE.
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-300">Copilot API Base URL</label>
            <input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} className="w-full rounded border border-white/15 bg-[#111] px-3 py-2 text-sm" placeholder="https://copilot.example.com" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Copilot API Key (bootstrap)</label>
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full rounded border border-white/15 bg-[#111] px-3 py-2 text-sm" placeholder="api-key-..." type="password" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Bootstrap role</label>
              <input value={bootstrapRole} onChange={(e) => setBootstrapRole(e.target.value)} className="w-full rounded border border-white/15 bg-[#111] px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">Bootstrap subject</label>
              <input value={bootstrapSubject} onChange={(e) => setBootstrapSubject(e.target.value)} className="w-full rounded border border-white/15 bg-[#111] px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Manual access token override (opzionale)</label>
            <input value={apiToken} onChange={(e) => setApiToken(e.target.value)} className="w-full rounded border border-white/15 bg-[#111] px-3 py-2 text-sm" placeholder="sk-..." type="password" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button onClick={handleSave} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">Salva configurazione</button>
          <button onClick={handleConnectionTest} className="rounded border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60" disabled={isTestingConnection}>
            {isTestingConnection ? "Testing..." : "Test connessione Copilot"}
          </button>
          {saved && <span className="text-xs text-emerald-400">Salvato</span>}
          {saveMessage && <span className="text-xs text-slate-300">{saveMessage}</span>}
        </div>

        <div className="mt-6 rounded border border-white/10 bg-[#111] p-3 text-xs">
          <div className="mb-2 font-medium text-slate-200">Sessione automatica token</div>
          <div className="mb-2 text-slate-300">
            {sessionInfo
              ? `Access token attivo${sessionInfo.expiresAt ? ` · scade: ${new Date(sessionInfo.expiresAt).toLocaleString()}` : ""} · refresh token: ${sessionInfo.refreshToken ? "presente" : "assente"}`
              : "Nessuna sessione attiva"}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleBootstrapSession} className="rounded border border-white/15 px-3 py-1.5 hover:bg-white/10">Avvia sessione (bootstrap)</button>
            <button onClick={handleRefreshSession} className="rounded border border-white/15 px-3 py-1.5 hover:bg-white/10">Refresh token</button>
            <button onClick={handleLogout} className="rounded border border-red-400/30 px-3 py-1.5 text-red-300 hover:bg-red-500/10">Logout locale</button>
          </div>
          {sessionMessage && <div className="mt-2 text-slate-300">{sessionMessage}</div>}
        </div>

        {connectionResult && (
          <pre className="mt-4 overflow-auto rounded border border-white/10 bg-[#090909] p-3 text-xs">{connectionResult}</pre>
        )}

        <div className="mt-6 flex gap-3">
          <Link to="/" className="rounded border border-white/15 px-3 py-2 text-sm hover:bg-white/10">Torna a App</Link>
          <Link to="/project-viewer" className="rounded border border-white/15 px-3 py-2 text-sm hover:bg-white/10">Apri IDE</Link>
        </div>
      </section>
    </main>
  );
};

export default Settings;
