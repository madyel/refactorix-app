import { useState, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { FileTree, FileNode } from "@/components/ide/FileTree";
import { CodeEditor } from "@/components/ide/CodeEditor";
import { TerminalPanel } from "@/components/ide/TerminalPanel";
import { AiChat } from "@/components/ide/AiChat";
import { sampleFiles } from "@/components/ide/sampleFiles";
import { Code2, Sparkles } from "lucide-react";

interface OpenTab {
  name: string;
  path: string;
  content: string;
  language?: string;
}

const Index = () => {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();

  const handleFileSelect = useCallback((file: FileNode, path: string) => {
    if (file.type !== "file") return;
    setSelectedPath(path);

    const existingTab = openTabs.find((t) => t.path === path);
    if (existingTab) {
      setActiveTab(path);
      return;
    }

    const newTab: OpenTab = {
      name: file.name,
      path,
      content: file.content || "",
      language: file.language,
    };
    setOpenTabs((prev) => [...prev, newTab]);
    setActiveTab(path);
  }, [openTabs]);

  const handleTabClose = useCallback((path: string) => {
    setOpenTabs((prev) => {
      const filtered = prev.filter((t) => t.path !== path);
      if (activeTab === path) {
        setActiveTab(filtered.length > 0 ? filtered[filtered.length - 1].path : null);
      }
      return filtered;
    });
  }, [activeTab]);

  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, content } : t))
    );
  }, []);

  return (
    <div className="flex h-screen flex-col">
      {/* Title bar */}
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

      {/* Main content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* File Tree */}
        <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
          <FileTree
            files={sampleFiles}
            onFileSelect={handleFileSelect}
            selectedPath={selectedPath}
          />
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border hover:bg-primary/50 transition-colors" />

        {/* Code Editor */}
        <ResizablePanel defaultSize={52} minSize={30}>
          <div className="flex flex-col h-full">
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

        <ResizableHandle className="w-px bg-border hover:bg-primary/50 transition-colors" />

        {/* AI Chat */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          <AiChat />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
