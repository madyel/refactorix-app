import type { BuilderSystemStatus } from "@/hooks/use-builder-runtime";

interface BuilderStatusPanelProps {
  model: string;
  modelOptions: string[];
  providerInfo: string;
  capabilityInfo: string;
  isLoading: boolean;
  error?: string | null;
  statusRows: BuilderSystemStatus[];
  onModelChange: (value: string) => void;
  onApplyModel: () => void;
  onRefresh: () => void;
}

export const BuilderStatusPanel = ({
  model,
  modelOptions,
  providerInfo,
  capabilityInfo,
  isLoading,
  error,
  statusRows,
  onModelChange,
  onApplyModel,
  onRefresh,
}: BuilderStatusPanelProps) => {
  return (
    <aside className="mb-6 w-full rounded-2xl border border-white/10 bg-[#171717]/90 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur lg:absolute lg:right-8 lg:top-24 lg:z-10 lg:mb-0 lg:max-w-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">System status</h2>
        <button type="button" className="text-xs text-slate-400 transition hover:text-slate-200" onClick={onRefresh}>
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="space-y-2">
        {statusRows.map((item) => (
          <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-200">{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  item.tone === "emerald"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-rose-500/15 text-rose-300"
                }`}
              >
                {item.value}
              </span>
            </div>
            <p className="text-xs text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-300">
        <p>Provider: {providerInfo}</p>
        <p className="mt-1">Capabilities: {capabilityInfo}</p>
      </div>

      <div className="mt-3 space-y-2">
        <select
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-white/10 bg-[#111111] px-3 text-sm text-slate-100 outline-none transition focus:border-blue-400"
          disabled={modelOptions.length === 0}
        >
          {modelOptions.length === 0 ? (
            <option value="">Nessun modello disponibile</option>
          ) : (
            modelOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))
          )}
        </select>
        <button
          type="button"
          onClick={onApplyModel}
          className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!model}
        >
          Usa modello
        </button>
        {error && <p className="text-xs text-rose-300">{error}</p>}
      </div>
    </aside>
  );
};
