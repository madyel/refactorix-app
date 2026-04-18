import { Dispatch, SetStateAction } from "react";
import { Search } from "lucide-react";

interface ProvisionResult {
  summary: string;
  repoPath: string;
  projectCreated: boolean;
  codeGenerated: boolean;
  nextSteps: string[];
}

interface ProjectBuilderFormProps {
  stackOptions: string[];
  templateOptions: string[];
  values: {
    projectName: string;
    featureRequest: string;
    basePath: string;
    stack: string;
    template: string;
    initGit: boolean;
    installDeps: boolean;
  };
  onPickWorkspace: () => void | Promise<void>;
  onCreateProject: () => void | Promise<void>;
  onCreateAndGenerate: () => void | Promise<void>;
  isSubmitting?: boolean;
  provisionResult?: ProvisionResult | null;
  provisionError?: string | null;
  actions: {
    setProjectName: (value: string) => void;
    setFeatureRequest: (value: string) => void;
    setBasePath: (value: string) => void;
    setStack: (value: string) => void;
    setTemplate: (value: string) => void;
    setInitGit: Dispatch<SetStateAction<boolean>>;
    setInstallDeps: Dispatch<SetStateAction<boolean>>;
  };
}

const historyItems = [
  {
    title: "Implement access screen with Tailwind and React Vite",
    meta: "47 min fa · code-companion-ai-13",
    delta: "+430 -102",
  },
  {
    title: "Identify codebase issues and propose fixes",
    meta: "3 apr · core-sight-api",
    delta: "+106 -0",
  },
];

export const ProjectBuilderForm = ({ values, actions, stackOptions, templateOptions, onPickWorkspace, onCreateProject, onCreateAndGenerate, isSubmitting = false, provisionResult, provisionError }: ProjectBuilderFormProps) => {
  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <form className="rounded-3xl border border-white/10 bg-[#242424]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur">
        <label className="block">
          <span className="sr-only">Descrivi un'attività</span>
          <textarea
            value={values.featureRequest}
            onChange={(event) => actions.setFeatureRequest(event.target.value)}
            rows={2}
            placeholder="Descrivi un'attività"
            className="w-full resize-none border-none bg-transparent px-2 py-1 text-xl text-slate-100 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-sm">
          <input
            value={values.projectName}
            onChange={(event) => actions.setProjectName(event.target.value)}
            placeholder="Nome progetto"
            className="h-10 min-w-[170px] flex-1 rounded-lg border border-white/10 bg-[#161616] px-3 text-slate-100 outline-none focus:border-blue-400"
          />

          <select
            value={values.stack}
            onChange={(event) => actions.setStack(event.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-[#161616] px-3 text-slate-100 outline-none focus:border-blue-400"
            disabled={stackOptions.length === 0}
          >
            {stackOptions.length === 0 ? (<option value="">Nessuno stack disponibile</option>) : stackOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <select
            value={values.template}
            onChange={(event) => actions.setTemplate(event.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-[#161616] px-3 text-slate-100 outline-none focus:border-blue-400"
            disabled={templateOptions.length === 0}
          >
            {templateOptions.length === 0 ? (<option value="">Nessun template disponibile</option>) : templateOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="flex min-w-[240px] flex-1 gap-2">
            <input
              value={values.basePath}
              onChange={(event) => actions.setBasePath(event.target.value)}
              placeholder="Base path"
              className="h-10 min-w-[180px] flex-1 rounded-lg border border-white/10 bg-[#161616] px-3 text-slate-100 outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => void onPickWorkspace()}
              className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-slate-100 transition hover:bg-white/[0.08]"
            >
              Scegli cartella
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={values.initGit}
              onChange={() => actions.setInitGit((value) => !value)}
              className="h-4 w-4 rounded border border-white/20 bg-[#161616] accent-blue-500"
            />
            init git
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={values.installDeps}
              onChange={() => actions.setInstallDeps((value) => !value)}
              className="h-4 w-4 rounded border border-white/20 bg-[#161616] accent-blue-500"
            />
            install deps
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => void onCreateProject()}
              disabled={isSubmitting}
              className="h-10 rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-slate-100 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creazione..." : "Crea solo progetto"}
            </button>
            <button
              type="button"
              onClick={() => void onCreateAndGenerate()}
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Generazione..." : "Crea framework software"}
            </button>
          </div>
        </div>
      </form>

      {provisionError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {provisionError}
        </div>
      )}

      {provisionResult && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <p className="font-semibold">{provisionResult.summary}</p>
          <p className="mt-1 text-emerald-200">Repository: {provisionResult.repoPath}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-emerald-200">
            {provisionResult.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#2b2b2b]/80 px-4 py-3 text-sm text-slate-200">
        <p className="font-medium">Configura Codex con Slack</p>
        <button type="button" className="text-slate-400 transition hover:text-slate-200">
          ✕
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#242424]/55 p-3 text-slate-200">
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-6 text-sm">
            <button type="button" className="border-b border-white pb-1 font-semibold text-white">
              Attività
            </button>
            <button type="button" className="text-slate-400 hover:text-slate-200">
              Revisioni del codice
            </button>
            <button type="button" className="text-slate-400 hover:text-slate-200">
              Archivio
            </button>
          </div>
          <Search className="h-4 w-4 text-slate-400" />
        </div>

        <div className="space-y-1">
          {historyItems.map((item) => (
            <article key={item.title} className="flex items-center justify-between rounded-lg px-2 py-3 hover:bg-white/[0.03]">
              <div>
                <h3 className="text-base font-semibold text-slate-100">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.meta}</p>
              </div>
              <p className="text-sm font-semibold text-emerald-400">{item.delta}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
