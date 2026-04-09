import { useState } from "react";

export const modelOptions = [
  "gpt-4.1-mini",
  "gpt-4.1",
  "claude-sonnet-4",
  "llama-3.3-70b",
];

export const stackOptions = ["python", "typescript", "go", "java"];
export const templateOptions = ["fastapi", "express", "nextjs", "spring-boot"];

export const useProjectBuilderForm = () => {
  const [projectName, setProjectName] = useState("my-platform");
  const [featureRequest, setFeatureRequest] = useState("es: mi crei una pagina login con il database");
  const [basePath, setBasePath] = useState("/workspace");
  const [model, setModel] = useState("");
  const [stack, setStack] = useState("python");
  const [template, setTemplate] = useState("fastapi");
  const [initGit, setInitGit] = useState(true);
  const [installDeps, setInstallDeps] = useState(false);

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
