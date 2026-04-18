import type { FileNode } from "@/components/ide/FileTree";

interface DesktopWorkspaceFsApi {
  workspace?: {
    listTree?: (path: string, depth?: number) => Promise<{ tree?: FileNode[] }>;
    readFile?: (path: string) => Promise<{ content?: string }>;
    writeFile?: (path: string, content: string) => Promise<{ ok?: boolean }>;
  };
}

const getWorkspaceApi = (): DesktopWorkspaceFsApi["workspace"] | undefined => {
  if (typeof window === "undefined") return undefined;
  const desktop = (window as unknown as { desktop?: DesktopWorkspaceFsApi }).desktop;
  return desktop?.workspace;
};

export const isLocalWorkspaceAvailable = () => Boolean(getWorkspaceApi()?.listTree);

export const listLocalWorkspaceTree = async (path: string, depth = 5): Promise<FileNode[]> => {
  const api = getWorkspaceApi();
  if (!api?.listTree) {
    throw new Error("Local workspace API non disponibile (richiede desktop mode).");
  }

  const result = await api.listTree(path, depth);
  return result.tree ?? [];
};

export const readLocalFile = async (path: string): Promise<string> => {
  const api = getWorkspaceApi();
  if (!api?.readFile) {
    throw new Error("Read file locale non disponibile (richiede desktop mode).");
  }

  const result = await api.readFile(path);
  return result.content ?? "";
};

export const writeLocalFile = async (path: string, content: string): Promise<void> => {
  const api = getWorkspaceApi();
  if (!api?.writeFile) {
    throw new Error("Write file locale non disponibile (richiede desktop mode).");
  }

  await api.writeFile(path, content);
};
