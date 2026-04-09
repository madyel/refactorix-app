import { BuilderHeader } from "@/components/project-builder/BuilderHeader";
import { BuilderStatusPanel } from "@/components/project-builder/BuilderStatusPanel";
import { ProjectBuilderForm } from "@/components/project-builder/ProjectBuilderForm";
import { useProjectBuilderForm } from "@/hooks/use-project-builder-form";

const Index = () => {
  const { values, actions } = useProjectBuilderForm();

  return (
    <main className="min-h-screen bg-[#070d24] p-5 text-slate-100 sm:p-8">
      <section className="mx-auto w-full max-w-[1720px] rounded-2xl border border-[#2b355f] bg-[radial-gradient(circle_at_55%_85%,rgba(38,76,192,0.22),transparent_42%),linear-gradient(180deg,#121a3d,#0e1536)] p-5 shadow-[0_0_0_1px_rgba(93,114,182,0.15),0_18px_70px_rgba(2,6,23,0.45)] sm:p-7 lg:p-9">
        <BuilderHeader />
        <BuilderStatusPanel model={values.model} onModelChange={actions.setModel} />
        <ProjectBuilderForm values={values} actions={actions} />
      </section>
    </main>
  );
};

export default Index;
