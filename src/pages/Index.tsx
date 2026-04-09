import { BuilderHeader } from "@/components/project-builder/BuilderHeader";
import { BuilderStatusPanel } from "@/components/project-builder/BuilderStatusPanel";
import { ProjectBuilderForm } from "@/components/project-builder/ProjectBuilderForm";
import { useProjectBuilderForm } from "@/hooks/use-project-builder-form";

const Index = () => {
  const { values, actions } = useProjectBuilderForm();

  return (
    <main className="min-h-screen bg-[#1b1b1b] p-4 text-slate-100 sm:p-7">
      <section className="relative mx-auto w-full max-w-[1720px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#1f1f1f,#171717)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8 lg:pr-[26rem]">
        <BuilderHeader />
        <BuilderStatusPanel model={values.model} onModelChange={actions.setModel} />
        <ProjectBuilderForm values={values} actions={actions} />
      </section>
    </main>
  );
};

export default Index;
