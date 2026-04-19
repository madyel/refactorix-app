export type WorkspaceSource = "local" | "remote";

export type WorkspaceFileOrigin = "local" | "remote" | "linked";

export interface WorkspaceDescriptor {
  source: WorkspaceSource;
  path: string;
}

export interface LinkedProjectMetadata {
  id: string;
  alias: string;
  remoteProjectId: string;
  remotePath: string;
  localPath: string;
  linkedAt: string;
  lastSyncAt?: string;
}

export interface CompareReview {
  localPath: string;
  remotePath: string;
  filePath: string;
  localContent: string;
  remoteContent: string;
  hasChanges: boolean;
  summary: string;
  diffPreview: string;
}
