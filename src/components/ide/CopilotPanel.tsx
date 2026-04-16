import { useEffect, useState } from "react";
import { featureFlags } from "@/config/featureFlags";
import { getConfiguredApiBaseUrl, setRuntimeApiBaseUrl } from "@/config/runtime-config";
import { useCopilotStore } from "@/features/copilot/store";
import type { CopilotMode, SessionRole } from "@/features/copilot/types";

const modeOptions: CopilotMode[] = ["analyze", "dry_run", "apply_patch", "commit"];
const roleOptions: SessionRole[] = ["guest", "operator", "reviewer", "admin"];

export const CopilotPanel = () => {
  const { state, selectedPatch, initialize, setField, submit, toggleHunk, acceptAll, rejectAll, sendFeedback } = useCopilotStore();

  const [apiBaseUrl, setApiBaseUrl] = useState(() => getConfiguredApiBaseUrl());

  const handleApiBaseUrlSave = () => {
    const normalized = setRuntimeApiBaseUrl(apiBaseUrl);
    setApiBaseUrl(normalized);
  };

  useEffect(() => {
    initialize().catch(() => undefined);
  }, [initialize]);

  if (!featureFlags.copilotEnabled) {
    return <div className="p-4 text-sm text-muted-foreground">Copilot disabilitato da feature flag.</div>;
  }

  return (
    <div className="flex h-full flex-col bg-card text-sm">
      <div className="border-b border-border px-3 py-2 font-semibold">Copilot Panel</div>

      <div className="space-y-3 border-b border-border p-3">
        <textarea
          value={state.task}
          onChange={(e) => setField("task", e.target.value)}
          placeholder="Descrivi il task..."
          className="h-24 w-full rounded border border-border bg-background p-2"
        />

        <input
          value={state.repo}
          onChange={(e) => setField("repo", e.target.value)}
          className="w-full rounded border border-border bg-background p-2"
          placeholder="Repo path"
        />

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Copilot API base URL</label>
          <div className="flex gap-2">
            <input
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full rounded border border-border bg-background p-2"
              placeholder="https://copilot.example.com"
            />
            <button onClick={handleApiBaseUrlSave} className="rounded border border-border px-3 py-2 text-xs">Save</button>
          </div>
          <p className="text-[11px] text-muted-foreground">Attivo: {getConfiguredApiBaseUrl() || "relative path"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={state.mode} onChange={(e) => setField("mode", e.target.value)} className="rounded border border-border bg-background p-2">
            {modeOptions.map((mode) => (
              <option
                key={mode}
                value={mode}
                disabled={(mode === "apply_patch" && !featureFlags.copilotApplyPatchEnabled) || (mode === "commit" && !featureFlags.copilotCommitEnabled)}
              >
                {mode}
              </option>
            ))}
          </select>

          <select value={state.role} onChange={(e) => setField("role", e.target.value)} className="rounded border border-border bg-background p-2">
            {roleOptions.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <button onClick={() => submit()} className="w-full rounded bg-primary px-3 py-2 text-primary-foreground disabled:opacity-60" disabled={!state.task || state.machineState === "submitting" || state.machineState === "streaming"}>
          {state.machineState === "submitting" || state.machineState === "streaming" ? "Running..." : "Start Run"}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-auto p-3">
        {state.error && <div className="rounded border border-destructive/40 bg-destructive/10 p-2 text-destructive">{state.error}</div>}

        <div className="rounded border border-border p-2">
          <div className="font-medium">System health</div>
          <div className="text-xs text-muted-foreground">
            Ollama: {state.endpointHealth.ollama} · Qdrant: {state.endpointHealth.qdrant} · Temporal: {state.endpointHealth.temporal}
          </div>
        </div>

        {state.output && (
          <div className="space-y-2 rounded border border-border p-2">
            <div className="font-medium">Executive summary</div>
            <p>{state.output.executiveSummary}</p>
            <ul className="list-disc pl-5 text-xs">{state.output.bulletPoints.map((item) => <li key={item}>{item}</li>)}</ul>
            <div className="text-xs"><span className="font-medium">Risks:</span> {state.output.risks.join(" · ")}</div>
            <div className="text-xs"><span className="font-medium">Next:</span> {state.output.nextSteps.join(" · ")}</div>
            <div className="flex gap-2">
              <button className="rounded border border-border px-2 py-1" onClick={() => sendFeedback(true)}>Feedback corretto</button>
              <button className="rounded border border-border px-2 py-1" onClick={() => sendFeedback(false)}>Feedback errato</button>
            </div>
          </div>
        )}

        <div className="rounded border border-border p-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">Diff review</div>
            <div className="space-x-2">
              <button onClick={acceptAll} className="rounded border border-border px-2 py-1 text-xs">Accept all</button>
              <button onClick={rejectAll} className="rounded border border-border px-2 py-1 text-xs">Reject all</button>
            </div>
          </div>
          <div className="space-y-2">
            {state.hunks.length === 0 && <div className="text-xs text-muted-foreground">Nessun hunk disponibile.</div>}
            {state.hunks.map((hunk) => (
              <div key={hunk.id} className="rounded border border-border p-2">
                <div className="flex items-center justify-between text-xs">
                  <code>{hunk.header}</code>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={hunk.accepted} onChange={(e) => toggleHunk(hunk.id, e.target.checked)} />
                    accept
                  </label>
                </div>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-[11px]">{hunk.body}</pre>
              </div>
            ))}
          </div>
          {selectedPatch && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs">Selected patch preview</summary>
              <pre className="mt-1 overflow-auto rounded bg-muted p-2 text-[11px]">{selectedPatch}</pre>
            </details>
          )}
        </div>

        <div className="rounded border border-border p-2">
          <div className="font-medium">Run timeline</div>
          <ul className="mt-2 space-y-1 text-xs">
            {state.runs.map((run) => (
              <li key={run.runId}>
                {run.runId} · {run.mode} · {run.state}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border border-border p-2">
          <div className="font-medium">Audit trail</div>
          <ul className="mt-2 space-y-1 text-xs">
            {state.auditTrail.map((event) => (
              <li key={`${event.timestamp}-${event.action}`}>
                [{event.timestamp}] {event.actor} {event.action} → {event.result}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
