import { Dispatch, SetStateAction } from "react";
import { stackOptions, templateOptions } from "@/hooks/use-project-builder-form";

interface ProjectBuilderFormProps {
  values: {
    projectName: string;
    featureRequest: string;
    basePath: string;
    stack: string;
    template: string;
    initGit: boolean;
    installDeps: boolean;
  };
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

export const ProjectBuilderForm = ({ values, actions }: ProjectBuilderFormProps) => {
  return (
    <form className="mt-7 space-y-5 text-xl">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <label className="space-y-2 xl:col-span-5">
          <span className="text-slate-200">Nome progetto</span>
          <input
            value={values.projectName}
            onChange={(event) => actions.setProjectName(event.target.value)}
            className="h-16 w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 text-slate-100 outline-none focus:border-blue-400"
          />
        </label>

        <label className="space-y-2 xl:col-span-3">
          <span className="text-slate-200">Stack</span>
          <select
            value={values.stack}
            onChange={(event) => actions.setStack(event.target.value)}
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
            value={values.template}
            onChange={(event) => actions.setTemplate(event.target.value)}
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
          value={values.featureRequest}
          onChange={(event) => actions.setFeatureRequest(event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 py-3 text-slate-100 outline-none focus:border-blue-400"
        />
      </label>

      <label className="block space-y-2">
        <span className="text-slate-200">Base path</span>
        <input
          value={values.basePath}
          onChange={(event) => actions.setBasePath(event.target.value)}
          className="h-16 w-full rounded-xl border border-[#4d5f98] bg-[#0a1436] px-4 text-slate-100 outline-none focus:border-blue-400"
        />
      </label>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-lg text-slate-100">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.initGit}
            onChange={() => actions.setInitGit((value) => !value)}
            className="h-8 w-8 rounded border border-[#6679b8] bg-[#0a1436] accent-[#436fff]"
          />
          init git
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.installDeps}
            onChange={() => actions.setInstallDeps((value) => !value)}
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
  );
};
