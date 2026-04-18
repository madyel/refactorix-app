import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree, type FileNode } from "@/components/ide/FileTree";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { CopilotPanel } from "@/components/ide/CopilotPanel";
import { Code2, Loader2, Save, Sparkles } from "lucide-react";
import { useProjectViewerTabs } from "@/hooks/use-project-viewer-tabs";
import { isLocalWorkspaceAvailable, listLocalWorkspaceTree, readLocalFile, writeLocalFile } from "@/features/workspace/local-fs";
import { remoteWorkspaceClient } from "@/features/workspace/remote-workspace-client";
import { linkedWorkspaceManager } from "@/features/workspace/linked-workspaces";
import { createCompareReview } from "@/features/workspace/sync";
import type { CompareReview, LinkedProjectMetadata } from "@/features/workspace/model";

const stripTrailingSlash = (value: string) => value.replace(/\/$/, "");

const relativeFromRoot = (rootPath: string, fullPath: string): string => {
  const normalizedRoot = stripTrailingSlash(rootPath);
  const normalizedPath = stripTrailingSlash(fullPath);
  if (!normalizedPath.startsWith(normalizedRoot)) return fullPath;
  return normalizedPath.slice(normalizedRoot.length).replace(/^\//, "");
};

const joinPath = (base: string, relative: string): string => {
  const normalizedBase = stripTrailingSlash(base);
  const normalizedRelative = relative.replace(/^\//, "");
  return `${normalizedBase}/${normalizedRelative}`;
};

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

  const [searchParams, setSearchParams] = useSearchParams();
  const initialPath = searchParams.get("path") ?? "";
  const initialModeParam = searchParams.get("mode");
  const initialMode: "remote" | "local" | "linked" =
    initialModeParam === "local" || initialModeParam === "linked" ? initialModeParam : "remote";

  const [workspaceMode, setWorkspaceMode] = useState<"remote" | "local" | "linked">(initialMode);
  const [projectPath, setProjectPath] = useState(initialPath);
  const [discoveredProjects, setDiscoveredProjects] = useState<string[]>([]);
  const [linkedProjects, setLinkedProjects] = useState<LinkedProjectMetadata[]>([]);
  const [selectedLinkedId, setSelectedLinkedId] = useState<string>("");
  const [treeFiles, setTreeFiles] = useState<FileNode[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [compareReview, setCompareReview] = useState<CompareReview | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const [linkAlias, setLinkAlias] = useState("");
  const [linkRemotePath, setLinkRemotePath] = useState("");
  const [linkLocalPath, setLinkLocalPath] = useState("");

  const localWorkspaceAvailable = isLocalWorkspaceAvailable();

  const selectedLinkedProject = useMemo(
    () => linkedProjects.find((entry) => entry.id === selectedLinkedId),
    [linkedProjects, selectedLinkedId],
  );

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("mode", workspaceMode);
      if (projectPath) {
        next.set("path", projectPath);
      } else {
        next.delete("path");
      }
      if (selectedLinkedId) {
        next.set("linked", selectedLinkedId);
      } else {
        next.delete("linked");
      }
      return next;
    });
  }, [workspaceMode, projectPath, selectedLinkedId, setSearchParams]);

  useEffect(() => {
    setLinkedProjects(linkedWorkspaceManager.list());
  }, []);

  useEffect(() => {
    if (workspaceMode !== "remote") return;

    let mounted = true;

    const loadProjects = async () => {
      try {
        const projects = await remoteWorkspaceClient.listProjects();
        if (!mounted) return;

        setDiscoveredProjects(projects);
        if (!projectPath && projects.length > 0) {
          setProjectPath(projects[0]);
        }
      } catch {
        if (mounted) {
          setTreeError("Impossibile caricare la discovery dei progetti dal backend remoto.");
        }
      }
    };

    void loadProjects();

    return () => {
      mounted = false;
    };
  }, [projectPath, workspaceMode]);

  useEffect(() => {
    if (workspaceMode !== "linked") return;
    if (selectedLinkedProject) {
      setProjectPath(selectedLinkedProject.localPath);
      return;
    }
    if (linkedProjects.length > 0) {
      setSelectedLinkedId(linkedProjects[0].id);
    }
  }, [workspaceMode, selectedLinkedProject, linkedProjects]);

  const loadTree = async (path: string) => {
    if (!path) {
      setTreeFiles([]);
      return;
    }

    setIsLoadingTree(true);
    setTreeError(null);

    try {
      let files: FileNode[];
      if (workspaceMode === "local") {
        files = await listLocalWorkspaceTree(path);
      } else if (workspaceMode === "remote") {
        files = await remoteWorkspaceClient.getTree(path);
      } else {
        if (!selectedLinkedProject) {
          throw new Error("Nessun progetto linked selezionato.");
        }
        files = await listLocalWorkspaceTree(selectedLinkedProject.localPath);
      }

      setTreeFiles(files);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore caricamento tree";
      setTreeError(`Errore Project Tree: ${message}`);
      setTreeFiles([]);
    } finally {
      setIsLoadingTree(false);
    }
  };

  useEffect(() => {
    const targetPath = workspaceMode === "linked" ? selectedLinkedProject?.localPath ?? "" : projectPath;
    void loadTree(targetPath);
  }, [projectPath, workspaceMode, selectedLinkedProject?.localPath]);

  const handleOpenFile = async (file: FileNode, path: string) => {
    if (workspaceMode === "local" && file.type === "file") {
      try {
        const content = await readLocalFile(path);
        handleFileSelect({ ...file, content }, path, { origin: "local" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "read failed";
        setTreeError(`Errore lettura file locale: ${message}`);
      }
      return;
    }

    if (workspaceMode === "linked" && file.type === "file") {
      try {
        const content = await readLocalFile(path);
        handleFileSelect({ ...file, content }, path, {
          origin: "linked",
          linkedProjectId: selectedLinkedProject?.id,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "read failed";
        setTreeError(`Errore lettura file linked: ${message}`);
      }
      return;
    }

    handleFileSelect(file, path, { origin: "remote" });
  };

  const activeTabData = useMemo(
    () => openTabs.find((tab) => tab.path === activeTab),
    [openTabs, activeTab],
  );

  const handleSaveActiveFile = async () => {
    if (!activeTabData) return;

    if (activeTabData.origin === "remote") {
      setSaveMessage("File remoto in sola lettura in questa versione (sync manuale richiesto).");
      return;
    }

    try {
      await writeLocalFile(activeTabData.path, activeTabData.content);
      setSaveMessage(`Salvato: ${activeTabData.path}`);
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "write failed";
      setSaveMessage(`Errore salvataggio: ${message}`);
    }
  };

  const handleLinkWorkspace = () => {
    if (!linkRemotePath || !linkLocalPath) {
      setTreeError("Per creare un linked workspace devi specificare path remoto e locale.");
      return;
    }

    const linked = linkedWorkspaceManager.upsert({
      alias: linkAlias,
      remotePath: linkRemotePath,
      localPath: linkLocalPath,
    });
    const next = linkedWorkspaceManager.list();
    setLinkedProjects(next);
    setSelectedLinkedId(linked.id);
    setWorkspaceMode("linked");
    setProjectPath(linked.localPath);
    setTreeError(null);
  };

  const handleCompareWithRemote = async () => {
    if (!selectedLinkedProject || !activeTabData) {
      setTreeError("Apri un file linked per avviare il compare con il remoto.");
      return;
    }

    setIsComparing(true);
    setTreeError(null);

    try {
      const relative = relativeFromRoot(selectedLinkedProject.localPath, activeTabData.path);
      const remoteFilePath = joinPath(selectedLinkedProject.remotePath, relative);
      const remoteContent = await remoteWorkspaceClient.readFileFromTree(
        selectedLinkedProject.remotePath,
        remoteFilePath,
      );

      if (typeof remoteContent !== "string") {
        throw new Error("Contenuto remoto non disponibile nel tree API per questo file.");
      }

      const review = createCompareReview({
        localPath: selectedLinkedProject.localPath,
        remotePath: selectedLinkedProject.remotePath,
        filePath: relative,
        localContent: activeTabData.content,
        remoteContent,
      });
      setCompareReview(review);
    } catch (error) {
      const message = error instanceof Error ? error.message : "compare failed";
      setTreeError(`Errore compare/sync: ${message}`);
    } finally {
      setIsComparing(false);
    }
  };

  const handleImportRemoteIntoLocal = async () => {
    if (!selectedLinkedProject || !activeTabData) {
      setTreeError("Apri un file linked per import remoto → locale.");
      return;
    }

    try {
      const relative = relativeFromRoot(selectedLinkedProject.localPath, activeTabData.path);
      const remoteFilePath = joinPath(selectedLinkedProject.remotePath, relative);
      const remoteContent = await remoteWorkspaceClient.readFileFromTree(
        selectedLinkedProject.remotePath,
        remoteFilePath,
      );

      if (typeof remoteContent !== "string") {
        throw new Error("Contenuto remoto non disponibile nel tree API per questo file.");
      }

      await writeLocalFile(activeTabData.path, remoteContent);
      handleContentChange(activeTabData.path, remoteContent);
      linkedWorkspaceManager.markSynced(selectedLinkedProject.id);
      setLinkedProjects(linkedWorkspaceManager.list());
      setCompareReview(
        createCompareReview({
          localPath: selectedLinkedProject.localPath,
          remotePath: selectedLinkedProject.remotePath,
          filePath: relative,
          localContent: remoteContent,
          remoteContent,
        }),
      );
      setSaveMessage(`Import remoto → locale completato: ${activeTabData.path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "import failed";
      setTreeError(`Errore import remoto → locale: ${message}`);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex h-10 items-center justify-between border-b border-border bg-ide-header px-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-foreground">Smart IDE — Dual Workspace</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs text-muted-foreground">{workspaceMode.toUpperCase()} CONTEXT</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 border-b border-border bg-ide-header/60 px-4 py-2 text-xs md:grid-cols-3">
        <div className="rounded border border-white/10 bg-[#111]/70 p-2">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">Workspace Context</p>
          <div className="flex items-center gap-2">
            <label className="text-muted-foreground">Mode</label>
            <select
              value={workspaceMode}
              onChange={(event) => setWorkspaceMode(event.target.value as "remote" | "local" | "linked")}
              className="rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
            >
              <option value="remote">Remote API</option>
              <option value="local" disabled={!localWorkspaceAvailable}>Local desktop</option>
              <option value="linked" disabled={!localWorkspaceAvailable || linkedProjects.length === 0}>Linked</option>
            </select>
          </div>

          {workspaceMode === "remote" && (
            <>
              <label className="mt-2 block text-muted-foreground">Remote project path</label>
              <input
                value={projectPath}
                onChange={(event) => setProjectPath(event.target.value)}
                className="mt-1 w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
                placeholder="/workspace/my-project"
              />
            </>
          )}

          {workspaceMode === "local" && (
            <>
              <label className="mt-2 block text-muted-foreground">Local workspace path</label>
              <input
                value={projectPath}
                onChange={(event) => setProjectPath(event.target.value)}
                className="mt-1 w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
                placeholder="/Users/.../workspace/project"
              />
            </>
          )}

          {workspaceMode === "linked" && (
            <>
              <label className="mt-2 block text-muted-foreground">Linked project</label>
              <select
                value={selectedLinkedId}
                onChange={(event) => setSelectedLinkedId(event.target.value)}
                className="mt-1 w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
              >
                {linkedProjects.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.alias} · {entry.remotePath}</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="rounded border border-white/10 bg-[#111]/70 p-2">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">Remote Workspace Client</p>
          {workspaceMode === "remote" && discoveredProjects.length > 0 && (
            <select
              value={projectPath}
              onChange={(event) => setProjectPath(event.target.value)}
              className="w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
            >
              {discoveredProjects.map((path) => (
                <option key={path} value={path}>{path}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => void loadTree(workspaceMode === "linked" ? selectedLinkedProject?.localPath ?? "" : projectPath)}
            className="mt-2 rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
            disabled={isLoadingTree}
          >
            {isLoadingTree ? "Loading..." : "Refresh tree"}
          </button>

          <button
            onClick={() => void handleSaveActiveFile()}
            className="ml-2 inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
            disabled={!activeTabData}
          >
            <Save className="h-3 w-3" />
            Save
          </button>
        </div>

        <div className="rounded border border-white/10 bg-[#111]/70 p-2">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-slate-400">Local Workspace Manager</p>
          <input
            value={linkAlias}
            onChange={(event) => setLinkAlias(event.target.value)}
            className="mb-1 w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
            placeholder="Alias linked project (es. my-platform)"
          />
          <input
            value={linkRemotePath}
            onChange={(event) => setLinkRemotePath(event.target.value)}
            className="mb-1 w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
            placeholder="Remote path (/workspace/my-platform)"
          />
          <input
            value={linkLocalPath}
            onChange={(event) => setLinkLocalPath(event.target.value)}
            className="w-full rounded border border-white/15 bg-[#111] px-2 py-1 text-xs text-slate-100"
            placeholder="Local path (/Users/me/workspace/my-platform)"
          />
          <button
            onClick={handleLinkWorkspace}
            className="mt-2 rounded border border-white/15 px-2 py-1 text-xs hover:bg-white/10"
          >
            Link remote ↔ local
          </button>
        </div>

        {isLoadingTree && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        {treeError && <span className="text-red-300">{treeError}</span>}
        {saveMessage && <span className="text-slate-300">{saveMessage}</span>}
      </div>

      {workspaceMode === "linked" && selectedLinkedProject && (
        <div className="border-b border-white/10 bg-[#0f1720] px-4 py-2 text-xs text-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-sky-400/40 px-2 py-0.5">linked</span>
            <span>Remote: {selectedLinkedProject.remotePath}</span>
            <span>Local: {selectedLinkedProject.localPath}</span>
            <button
              onClick={() => void handleCompareWithRemote()}
              className="rounded border border-white/20 px-2 py-0.5 hover:bg-white/10"
              disabled={!activeTabData || isComparing}
            >
              Compare local vs remote
            </button>
            <button
              onClick={() => void handleImportRemoteIntoLocal()}
              className="rounded border border-white/20 px-2 py-0.5 hover:bg-white/10"
              disabled={!activeTabData || isComparing}
            >
              Import remote → local
            </button>
          </div>
          {compareReview && (
            <div className="mt-2 rounded border border-white/10 bg-[#0a1118] p-2">
              <p className="font-semibold">Diff review · {compareReview.filePath}</p>
              <p className="text-slate-400">{compareReview.summary}</p>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[11px] text-slate-300">
                {compareReview.diffPreview || "Nessuna differenza"}
              </pre>
            </div>
          )}
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
          <FileTree files={treeFiles} onFileSelect={handleOpenFile} selectedPath={selectedPath} />
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
