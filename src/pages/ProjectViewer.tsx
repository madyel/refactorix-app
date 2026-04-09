import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree } from "@/components/ide/FileTree";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { AiChat } from "@/components/ide/AiChat";
import { sampleFiles } from "@/components/ide/sampleFiles";
import { Code2, Sparkles } from "lucide-react";
import { useProjectViewerTabs } from "@/hooks/use-project-viewer-tabs";

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

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
          <FileTree files={sampleFiles} onFileSelect={handleFileSelect} selectedPath={selectedPath} />
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
          <AiChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectViewer;
