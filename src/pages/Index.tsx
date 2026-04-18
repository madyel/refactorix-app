import { useEffect } from "react";
import { BuilderHeader } from "@/components/project-builder/BuilderHeader";
import { BuilderStatusPanel } from "@/components/project-builder/BuilderStatusPanel";
import { ProjectBuilderForm } from "@/components/project-builder/ProjectBuilderForm";
import { useBuilderRuntime } from "@/hooks/use-builder-runtime";
import { useProjectBuilderForm } from "@/hooks/use-project-builder-form";

const Index = () => {
  const runtime = useBuilderRuntime();
  const { values, actions } = useProjectBuilderForm({
    stackOptions: runtime.stackOptions,
    templateOptions: runtime.templateOptions,
    modelOptions: runtime.modelOptions,
  });

  const scopedTemplateOptions = runtime.getTemplateOptionsForStack(values.stack);

  useEffect(() => {
    if (scopedTemplateOptions.length === 0) return;
    if (!scopedTemplateOptions.includes(values.template)) {
      actions.setTemplate(scopedTemplateOptions[0]);
    }
  }, [actions.setTemplate, scopedTemplateOptions, values.template]);

  const handleApplyModel = async () => {
    await runtime.applyModel(values.model);
  };

  return (
    <main className="min-h-screen bg-[#1b1b1b] p-4 text-slate-100 sm:p-7">
      <section className="relative mx-auto w-full max-w-[1720px] overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,#1f1f1f,#171717)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] sm:p-8 lg:pr-[26rem]">
        <BuilderHeader />
        <BuilderStatusPanel
          model={values.model}
          modelOptions={runtime.modelOptions}
          statusRows={runtime.systemStatus}
          providerInfo={runtime.providerInfo}
          capabilityInfo={runtime.capabilityInfo}
          isLoading={runtime.isLoading}
          error={runtime.error}
          onModelChange={actions.setModel}
          onApplyModel={handleApplyModel}
          onRefresh={runtime.refresh}
        />
        <ProjectBuilderForm
          values={values}
          actions={actions}
          stackOptions={runtime.stackOptions}
          templateOptions={scopedTemplateOptions}
        />
      </section>
    </main>
  );
};

export default Index;
