import { useCallback, useState } from "react";
import { FileNode } from "@/components/ide/FileTree";
import type { WorkspaceFileOrigin } from "@/features/workspace/model";

export interface OpenTab {
  name: string;
  path: string;
  content: string;
  language?: string;
  origin: WorkspaceFileOrigin;
  linkedProjectId?: string;
}

export const useProjectViewerTabs = () => {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();

  const handleFileSelect = useCallback((
    file: FileNode,
    path: string,
    metadata?: { origin?: WorkspaceFileOrigin; linkedProjectId?: string },
  ) => {
    if (file.type !== "file") return;
    setSelectedPath(path);

    const existingTab = openTabs.find((tab) => tab.path === path);
    if (existingTab) {
      setActiveTab(path);
      return;
    }

    const newTab: OpenTab = {
      name: file.name,
      path,
      content: file.content || "",
      language: file.language,
      origin: metadata?.origin ?? "remote",
      linkedProjectId: metadata?.linkedProjectId,
    };

    setOpenTabs((previousTabs) => [...previousTabs, newTab]);
    setActiveTab(path);
  }, [openTabs]);

  const handleTabClose = useCallback((path: string) => {
    setOpenTabs((previousTabs) => {
      const filteredTabs = previousTabs.filter((tab) => tab.path !== path);
      if (activeTab === path) {
        setActiveTab(filteredTabs.length > 0 ? filteredTabs[filteredTabs.length - 1].path : null);
      }
      return filteredTabs;
    });
  }, [activeTab]);

  const handleContentChange = useCallback((path: string, content: string) => {
    setOpenTabs((previousTabs) => previousTabs.map((tab) => (tab.path === path ? { ...tab, content } : tab)));
  }, []);

  return {
    openTabs,
    activeTab,
    selectedPath,
    setActiveTab,
    handleFileSelect,
    handleTabClose,
    handleContentChange,
  };
};
