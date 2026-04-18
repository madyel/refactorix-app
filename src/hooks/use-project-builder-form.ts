import { useEffect, useState } from "react";

interface UseProjectBuilderFormOptions {
  stackOptions: string[];
  templateOptions: string[];
  modelOptions: string[];
}

export const useProjectBuilderForm = ({
  stackOptions,
  templateOptions,
  modelOptions,
}: UseProjectBuilderFormOptions) => {
  const [projectName, setProjectName] = useState("my-platform");
  const [featureRequest, setFeatureRequest] = useState("es: mi crei una pagina login con il database");
  const [basePath, setBasePath] = useState("/workspace");
  const [model, setModel] = useState("");
  const [stack, setStack] = useState("");
  const [template, setTemplate] = useState("");
  const [initGit, setInitGit] = useState(true);
  const [installDeps, setInstallDeps] = useState(false);

  useEffect(() => {
    if (!stack && stackOptions.length > 0) {
      setStack(stackOptions[0]);
    }
  }, [stack, stackOptions]);

  useEffect(() => {
    if (!template && templateOptions.length > 0) {
      setTemplate(templateOptions[0]);
    }
  }, [template, templateOptions]);

  useEffect(() => {
    if (!model && modelOptions.length > 0) {
      setModel(modelOptions[0]);
    }
  }, [model, modelOptions]);

  return {
    values: {
      projectName,
      featureRequest,
      basePath,
      model,
      stack,
      template,
      initGit,
      installDeps,
    },
    actions: {
      setProjectName,
      setFeatureRequest,
      setBasePath,
      setModel,
      setStack,
      setTemplate,
      setInitGit,
      setInstallDeps,
    },
  };
};
