import { modelOptions } from "@/hooks/use-project-builder-form";

interface BuilderStatusPanelProps {
  model: string;
  onModelChange: (value: string) => void;
}

export const BuilderStatusPanel = ({ model, onModelChange }: BuilderStatusPanelProps) => {
  return (
    <div className="space-y-4 text-lg leading-tight text-slate-300">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-300">
          LLM: offline
        </span>
        <p className="min-w-[300px] flex-1">
          Ollama non raggiungibile (n/a) · lat=n/ams · err=MISSING_TOKEN: Missing bearer token | Use Authorization:
          Bearer {'<'}token{'>'} or authenticated session cookie
        </p>
        <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-300">
          Qdrant: offline
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-[300px] flex-1">
          Qdrant non raggiungibile (n/a) · lat=n/ams · err=MISSING_TOKEN: Missing bearer token | Use Authorization:
          Bearer {'<'}token{'>'} or authenticated session cookie · advice=n/a
        </p>
        <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 font-medium text-emerald-300">
          Temporal: online (temporal)
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-[300px] flex-1">
          Temporal @ localhost:7233 · ns=default · q=ai-engineer-runs · lat=0.1ms · queued_age=n/a
        </p>

        <select
          value={model}
          onChange={(event) => onModelChange(event.target.value)}
          className="h-14 min-w-[320px] rounded-xl border border-[#50609c] bg-[#0a1436] px-4 text-slate-100 outline-none ring-0 transition focus:border-blue-400"
        >
          <option value="">Seleziona modello</option>
          {modelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button className="h-14 rounded-xl border border-[#50609c] bg-[#162247] px-6 font-medium text-slate-100 transition hover:bg-[#1d2c56]">
          Usa modello
        </button>
        <button className="h-14 rounded-xl border border-[#50609c] bg-[#162247] px-6 font-medium text-slate-100 transition hover:bg-[#1d2c56]">
          Refresh LLM
        </button>
      </div>
    </div>
  );
};
