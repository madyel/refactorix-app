import type { FileNode } from "@/components/ide/FileTree";
import { getProjectTree, listDiscoveredProjects } from "@/features/project-explorer/tree";
import { invokeCatalogEndpoint } from "@/features/copilot/catalog-client";

interface RemoteRegistryResponse {
  projects?: unknown;
}

interface RemoteRegistryProjectPayload {
  project_id?: unknown;
  root_path?: unknown;
  label?: unknown;
  metadata?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

export interface RemoteRegistryProject {
  projectId: string;
  rootPath: string;
  label?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeRegistryProject = (input: unknown): RemoteRegistryProject | undefined => {
  if (!isRecord(input)) return undefined;

  const payload = input as RemoteRegistryProjectPayload;
  const projectId = typeof payload.project_id === "string" ? payload.project_id : undefined;
  const rootPath = typeof payload.root_path === "string" ? payload.root_path : undefined;

  if (!projectId || !rootPath) return undefined;

  return {
    projectId,
    rootPath,
    label: typeof payload.label === "string" ? payload.label : undefined,
    metadata: isRecord(payload.metadata) ? payload.metadata : undefined,
    createdAt: typeof payload.created_at === "string" ? payload.created_at : undefined,
    updatedAt: typeof payload.updated_at === "string" ? payload.updated_at : undefined,
  };
};

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

const asFileNode = (value: unknown): FileNode | undefined => {
  if (!isRecord(value)) return undefined;
  if (typeof value.name !== "string") return undefined;

  const type = value.type;
  if (type !== "file" && type !== "folder") return undefined;

  const childrenRaw = Array.isArray(value.children) ? value.children : undefined;
  const children = childrenRaw?.map(asFileNode).filter((item): item is FileNode => Boolean(item));

  return {
    name: value.name,
    type,
    fullPath: typeof value.path === "string" ? value.path : typeof value.fullPath === "string" ? value.fullPath : undefined,
    content: typeof value.content === "string" ? value.content : undefined,
    language: typeof value.language === "string" ? value.language : undefined,
    children: type === "folder" ? children : undefined,
  };
};

const normalizeTreeResponse = (raw: unknown): FileNode[] => {
  if (Array.isArray(raw)) {
    return raw.map(asFileNode).filter((item): item is FileNode => Boolean(item));
  }

  if (isRecord(raw)) {
    const tree = raw.tree;
    if (Array.isArray(tree)) {
      return tree.map(asFileNode).filter((item): item is FileNode => Boolean(item));
    }
  }

  return [];
};

export const remoteWorkspaceClient = {
  async listLegacyProjects(): Promise<string[]> {
    return listDiscoveredProjects();
  },

  async listRegistryProjects(): Promise<RemoteRegistryProject[]> {
    const response = (await invokeCatalogEndpoint({
      method: "GET",
      path: "/v1/projects/remote/registry",
    })) as RemoteRegistryResponse;

    if (!Array.isArray(response.projects)) return [];

    return response.projects
      .map(normalizeRegistryProject)
      .filter((entry): entry is RemoteRegistryProject => Boolean(entry));
  },

  async registerProject(input: {
    projectId: string;
    rootPath: string;
    label?: string;
    metadata?: Record<string, unknown>;
  }): Promise<RemoteRegistryProject | undefined> {
    const response = await invokeCatalogEndpoint({
      method: "POST",
      path: "/v1/projects/remote/registry/register",
      body: {
        project_id: input.projectId,
        root_path: input.rootPath,
        label: input.label,
        metadata: input.metadata,
      },
    });

    if (!isRecord(response)) return undefined;
    return normalizeRegistryProject(response.project ?? response.data ?? response);
  },

  async getTree(projectId: string, path = ".", depth = 4): Promise<FileNode[]> {
    const response = await invokeCatalogEndpoint({
      method: "GET",
      path: "/v1/projects/remote/{project_id}/tree",
      pathParams: { project_id: projectId },
      query: { path, depth },
    });

    return normalizeTreeResponse(response);
  },

  async readFile(projectId: string, path: string): Promise<string> {
    const response = await invokeCatalogEndpoint({
      method: "GET",
      path: "/v1/projects/remote/{project_id}/read",
      pathParams: { project_id: projectId },
      query: { path },
    });

    if (!isRecord(response)) return "";
    return typeof response.content === "string" ? response.content : "";
  },

  async writeFile(projectId: string, path: string, content: string): Promise<void> {
    await invokeCatalogEndpoint({
      method: "POST",
      path: "/v1/projects/remote/{project_id}/write",
      pathParams: { project_id: projectId },
      body: {
        path,
        content,
        encoding: "utf-8",
        create_dirs: true,
      },
    });
  },

  async compare(projectId: string, localPath: string, remotePath?: string): Promise<Record<string, unknown>> {
    const response = await invokeCatalogEndpoint({
      method: "POST",
      path: "/v1/projects/remote/{project_id}/compare",
      pathParams: { project_id: projectId },
      body: {
        local_path: localPath,
        remote_path: remotePath,
      },
    });

    return isRecord(response) ? response : {};
  },

  async syncPull(projectId: string, localPath: string, remotePath?: string): Promise<Record<string, unknown>> {
    const response = await invokeCatalogEndpoint({
      method: "POST",
      path: "/v1/projects/remote/{project_id}/sync/pull",
      pathParams: { project_id: projectId },
      body: {
        local_path: localPath,
        remote_path: remotePath,
        dry_run: false,
      },
    });

    return isRecord(response) ? response : {};
  },

  async syncPush(projectId: string, localPath: string, remotePath?: string): Promise<Record<string, unknown>> {
    const response = await invokeCatalogEndpoint({
      method: "POST",
      path: "/v1/projects/remote/{project_id}/sync/push",
      pathParams: { project_id: projectId },
      body: {
        local_path: localPath,
        remote_path: remotePath,
        dry_run: false,
      },
    });

    return isRecord(response) ? response : {};
  },

  async getLegacyTree(projectPath: string, depth = 4): Promise<FileNode[]> {
    return getProjectTree(projectPath, depth);
  },

  async readFileFromLegacyTree(projectPath: string, filePath: string, depth = 8): Promise<string | undefined> {
    const tree = await getProjectTree(projectPath, depth);
    const match = walk(tree, "", filePath);
    if (!match || typeof match.content !== "string") return undefined;
    return match.content;
  },
};
