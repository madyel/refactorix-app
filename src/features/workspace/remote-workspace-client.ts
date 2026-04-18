import type { FileNode } from "@/components/ide/FileTree";
import { getProjectTree, listDiscoveredProjects } from "@/features/project-explorer/tree";

const walk = (nodes: FileNode[], basePath: string, targetPath: string): FileNode | undefined => {
  for (const node of nodes) {
    const currentPath = node.fullPath ?? `${basePath}/${node.name}`;

    if (currentPath === targetPath && node.type === "file") {
      return { ...node, fullPath: currentPath };
    }

    if (node.type === "folder" && node.children) {
      const found = walk(node.children, currentPath, targetPath);
      if (found) return found;
    }
  }
  return undefined;
};

export const remoteWorkspaceClient = {
  async listProjects(): Promise<string[]> {
    return listDiscoveredProjects();
  },

  async getTree(projectPath: string, depth = 4): Promise<FileNode[]> {
    return getProjectTree(projectPath, depth);
  },

  async readFileFromTree(projectPath: string, filePath: string, depth = 8): Promise<string | undefined> {
    const tree = await getProjectTree(projectPath, depth);
    const match = walk(tree, "", filePath);
    if (!match || typeof match.content !== "string") return undefined;
    return match.content;
  },
};
