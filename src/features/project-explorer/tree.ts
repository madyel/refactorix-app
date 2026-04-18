import { backendClient } from "@/api";
import type { FileNode } from "@/components/ide/FileTree";

interface ProjectDiscoveryResponse {
  projects?: unknown;
  data?: {
    projects?: unknown;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isFileNode = (value: unknown): value is FileNode => {
  if (!isRecord(value)) return false;
  const type = value.type;
  return typeof value.name === "string" && (type === "file" || type === "folder");
};

const withLanguage = (name: string): string | undefined => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;

  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    css: "css",
    html: "html",
  };

  return map[ext];
};

const normalizeTreeFromObjectMap = (input: Record<string, unknown>): FileNode[] =>
  Object.entries(input).map(([key, value]) => {
    if (isRecord(value)) {
      const children = normalizeTree(value);
      return {
        name: key,
        type: children.length > 0 ? "folder" : "file",
        children: children.length > 0 ? children : undefined,
        language: children.length === 0 ? withLanguage(key) : undefined,
      } satisfies FileNode;
    }

    return {
      name: key,
      type: "file",
      content: typeof value === "string" ? value : undefined,
      language: withLanguage(key),
    } satisfies FileNode;
  });

export const normalizeTree = (raw: unknown): FileNode[] => {
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => {
      if (isFileNode(item)) {
        const children = normalizeTree(item.children);
        return [
          {
            ...item,
            language: item.language ?? withLanguage(item.name),
            children: item.type === "folder" ? children : undefined,
          },
        ];
      }

      if (isRecord(item)) {
        return normalizeTreeFromObjectMap(item);
      }

      return [];
    });
  }

  if (isRecord(raw)) {
    const directTree = raw.tree ?? raw.data ?? raw.files ?? raw.nodes;
    if (directTree && directTree !== raw) {
      return normalizeTree(directTree);
    }
    return normalizeTreeFromObjectMap(raw);
  }

  return [];
};

const readProjectList = (response: ProjectDiscoveryResponse): string[] => {
  const candidates = response.projects ?? response.data?.projects;

  if (!Array.isArray(candidates)) return [];

  return candidates
    .map((item) => {
      if (typeof item === "string") return item;
      if (isRecord(item)) {
        const fromPath = item.path;
        const fromProjectPath = item.project_path;
        if (typeof fromPath === "string") return fromPath;
        if (typeof fromProjectPath === "string") return fromProjectPath;
      }
      return undefined;
    })
    .filter((item): item is string => Boolean(item));
};

export const listDiscoveredProjects = async (): Promise<string[]> => {
  const response = (await backendClient.call(
    "discover_projects_v1_projects_discovery_get",
  )) as ProjectDiscoveryResponse;

  return readProjectList(response);
};

export const getProjectTree = async (projectPath: string, depth = 4): Promise<FileNode[]> => {
  const response = await backendClient.call("project_tree_v1_projects_tree_get", {
    query: { project_path: projectPath, depth },
  });

  return normalizeTree(response);
};
