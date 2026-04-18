import { useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree, type FileNode } from "@/components/ide/FileTree";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { CopilotPanel } from "@/components/ide/CopilotPanel";
import { Code2, Loader2, Sparkles } from "lucide-react";
import { useProjectViewerTabs } from "@/hooks/use-project-viewer-tabs";
import { getProjectTree, listDiscoveredProjects } from "@/features/project-explorer/tree";

const ProjectViewer = () => {
  const {
    openTabs,
    activeTab,
    selectedPath,
    setActiveTab,
    handleFileSelect,
    handleTabClose,
    handleContentChange,
  } = useProjectViewerTabs();

  const [projectPath, setProjectPath] = useState("");
  const [discoveredProjects, setDiscoveredProjects] = useState<string[]>([]);
  const [treeFiles, setTreeFiles] = useState<FileNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        const projects = await listDiscoveredProjects();
        if (!mounted) return;

        setDiscoveredProjects(projects);
        if (!projectPath && projects.length > 0) {
          setProjectPath(projects[0]);
        }
      } catch {
        if (mounted) {
          setTreeError("Impossibile caricare la discovery dei progetti dal Copilot backend.");
        }
      }
    };

    void loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const loadTree = async (path: string) => {
    if (!path) {
      setTreeFiles([]);
      return;
    }

    setIsLoadingTree(true);
    setTreeError(null);

    try {
      const files = await getProjectTree(path);
      setTreeFiles(files);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore caricamento tree";
      setTreeError(`Errore Project Tree API: ${message}`);
      setTreeFiles([]);
    } finally {
      setIsLoadingTree(false);
    }
  };

  useEffect(() => {
    void loadTree(projectPath);
  }, [projectPath]);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-10 items-center justify-between border-b border-border bg-ide-header px-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">SmartCode IDE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs text-muted-foreground">AI-Powered</span>
        </div>
      </div>

      <div className="flex items-center gap-3 border-b border-border bg-ide-header/60 px-4 py-2 text-xs">
        <label className="text-muted-foreground">Project path</label>
        <input
          value={projectPath}
          onChange={(event) => setProjectPath(event.target.value)}
          className="w-[420px] max-w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
          placeholder="/workspace/my-project"
        />
        {discoveredProjects.length > 0 && (
          <select
            value={projectPath}
            onChange={(event) => setProjectPath(event.target.value)}
            className="rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
          >
            {discoveredProjects.map((path) => (
              <option key={path} value={path}>
                {path}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => void loadTree(projectPath)}
          className="rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
          disabled={isLoadingTree}
        >
          {isLoadingTree ? "Loading..." : "Refresh tree"}
        </button>

        {isLoadingTree && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        {treeError && <span className="text-red-300">{treeError}</span>}
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
          <FileTree files={treeFiles} onFileSelect={handleFileSelect} selectedPath={selectedPath} />
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border transition-colors hover:bg-primary/50" />

        <ResizablePanel defaultSize={52} minSize={30}>
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-hidden">
              <CodeEditor
                openTabs={openTabs}
                activeTab={activeTab}
                onTabSelect={setActiveTab}
                onTabClose={handleTabClose}
                onContentChange={handleContentChange}
              />
            </div>
            <TerminalPanel />
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border transition-colors hover:bg-primary/50" />

        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          <CopilotPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectViewer;
