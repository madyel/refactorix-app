import { useState } from "react";
import { Box, Sparkles } from "lucide-react";

const modelOptions = [
  "gpt-4.1-mini",
  "gpt-4.1",
  "claude-sonnet-4",
  "llama-3.3-70b",
];

const stackOptions = ["python", "typescript", "go", "java"];
const templateOptions = ["fastapi", "express", "nextjs", "spring-boot"];

const Index = () => {
  const [projectName, setProjectName] = useState("my-platform");
  const [featureRequest, setFeatureRequest] = useState("es: mi crei una pagina login con il database");
  const [basePath, setBasePath] = useState("/workspace");
  const [model, setModel] = useState("");
  const [stack, setStack] = useState("python");
  const [template, setTemplate] = useState("fastapi");
  const [initGit, setInitGit] = useState(true);
  const [installDeps, setInstallDeps] = useState(false);

  return (
    <main className="min-h-screen bg-[#070d24] p-5 text-slate-100 sm:p-8">
      <section className="mx-auto w-full max-w-[1720px] rounded-2xl border border-[#2b355f] bg-[radial-gradient(circle_at_55%_85%,rgba(38,76,192,0.22),transparent_42%),linear-gradient(180deg,#121a3d,#0e1536)] p-5 shadow-[0_0_0_1px_rgba(93,114,182,0.15),0_18px_70px_rgba(2,6,23,0.45)] sm:p-7 lg:p-9">
        <header className="mb-5 space-y-3">
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-[#1f2e53]">
            <Box className="h-8 w-8 fill-orange-400 text-orange-500" strokeWidth={1.6} />
            Framework &amp; Project Builder
          </h1>
          <p className="text-xl text-slate-200/95">
            Codex-style workflow <Sparkles className="mx-1 inline h-7 w-7 text-amber-300" />:
            crea progetto + genera feature in un flusso unico e guidato.
          </p>
        </header>

        <div className="space-y-4 text-lg leading-tight text-slate-300">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-300">
              LLM: offline
            </span>
            <p className="flex-1 min-w-[300px]">
              Ollama non raggiungibile (n/a) · lat=n/ams · err=MISSING_TOKEN: Missing bearer token | Use
              Authorization: Bearer {'<'}token{'>'} or authenticated session cookie
            </p>
            <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 font-medium text-rose-300">
              Qdrant: offline
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 min-w-[300px]">
              Qdrant non raggiungibile (n/a) · lat=n/ams · err=MISSING_TOKEN: Missing bearer token | Use
              Authorization: Bearer {'<'}token{'>'} or authenticated session cookie · advice=n/a
            </p>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 font-medium text-emerald-300">
              Temporal: online (temporal)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="flex-1 min-w-[300px]">Temporal @ localhost:7233 · ns=default · q=ai-engineer-runs · lat=0.1ms · queued_age=n/a</p>

            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
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

        <form className="mt-7 space-y-5 text-xl">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            <label className="space-y-2 xl:col-span-5">
              <span className="text-slate-200">Nome progetto</span>
              <input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                className="h-16 w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 text-slate-100 outline-none focus:border-blue-400"
              />
            </label>

            <label className="space-y-2 xl:col-span-3">
              <span className="text-slate-200">Stack</span>
              <select
                value={stack}
                onChange={(event) => setStack(event.target.value)}
                className="h-16 w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 text-slate-100 outline-none focus:border-blue-400"
              >
                {stackOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 xl:col-span-3">
              <span className="text-slate-200">Template</span>
              <select
                value={template}
                onChange={(event) => setTemplate(event.target.value)}
                className="h-16 w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 text-slate-100 outline-none focus:border-blue-400"
              >
                {templateOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-slate-200">Feature richiesta</span>
            <textarea
              value={featureRequest}
              onChange={(event) => setFeatureRequest(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 py-3 text-slate-100 outline-none focus:border-blue-400"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-slate-200">Base path</span>
            <input
              value={basePath}
              onChange={(event) => setBasePath(event.target.value)}
              className="h-16 w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 text-slate-100 outline-none focus:border-blue-400"
            />
          </label>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-lg text-slate-100">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={initGit}
                onChange={() => setInitGit((value) => !value)}
                className="h-8 w-8 rounded border border-[#6679b8] bg-[#0a1436] accent-[#436fff]"
              />
              init git
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={installDeps}
                onChange={() => setInstallDeps((value) => !value)}
                className="h-8 w-8 rounded border border-[#6679b8] bg-[#0a1436] accent-[#436fff]"
              />
              install deps
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              className="h-14 rounded-xl border border-slate-400/50 bg-transparent px-6 text-xl font-medium text-slate-200 transition hover:bg-white/5"
            >
              Crea solo progetto
            </button>
            <button
              type="button"
              className="h-14 rounded-xl border border-[#4c72ff] bg-[#2f57d3] px-6 text-xl font-medium text-slate-100 transition hover:bg-[#3a63e1]"
            >
              Crea framework software
            </button>
            <p className="text-lg text-slate-300">Role attuale: guest — reviewer/admin richiesto.</p>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Index;
