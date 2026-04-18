import type { LinkedProjectMetadata } from "./model";

const STORAGE_KEY = "smartide.linkedWorkspaces.v1";

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalize = (value: unknown): LinkedProjectMetadata[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return undefined;
      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const alias = typeof record.alias === "string" ? record.alias : "";
      const remoteProjectId = typeof record.remoteProjectId === "string" ? record.remoteProjectId : "";
      const remotePath = typeof record.remotePath === "string" ? record.remotePath : "";
      const localPath = typeof record.localPath === "string" ? record.localPath : "";
      const linkedAt = typeof record.linkedAt === "string" ? record.linkedAt : "";
      const lastSyncAt = typeof record.lastSyncAt === "string" ? record.lastSyncAt : undefined;

      if (!id || !remotePath || !localPath || !linkedAt) return undefined;

      return {
        id,
        alias: alias || id,
        remoteProjectId: remoteProjectId || slugFromPath(remotePath),
        remotePath,
        localPath,
        linkedAt,
        lastSyncAt,
      } satisfies LinkedProjectMetadata;
    })
    .filter((entry): entry is LinkedProjectMetadata => Boolean(entry));
};

const readAll = (): LinkedProjectMetadata[] => {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalize(JSON.parse(raw));
  } catch {
    return [];
  }
};

const saveAll = (entries: LinkedProjectMetadata[]) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const slugFromPath = (value: string) =>
  value
    .split(/[\\/]/)
    .filter(Boolean)
    .pop() || "linked-project";

export const linkedWorkspaceManager = {
  list(): LinkedProjectMetadata[] {
    return readAll();
  },

  upsert(input: { remoteProjectId: string; remotePath: string; localPath: string; alias?: string }): LinkedProjectMetadata {
    const current = readAll();
    const existing = current.find(
      (entry) => entry.remotePath === input.remotePath || entry.localPath === input.localPath,
    );

    const now = new Date().toISOString();

    if (existing) {
      const updated: LinkedProjectMetadata = {
        ...existing,
        alias: input.alias?.trim() || existing.alias,
        remoteProjectId: input.remoteProjectId,
        remotePath: input.remotePath,
        localPath: input.localPath,
      };
      saveAll(current.map((entry) => (entry.id === existing.id ? updated : entry)));
      return updated;
    }

    const id = `${slugFromPath(input.remotePath)}-${Date.now()}`;
    const created: LinkedProjectMetadata = {
      id,
      alias: input.alias?.trim() || slugFromPath(input.remotePath),
      remoteProjectId: input.remoteProjectId,
      remotePath: input.remotePath,
      localPath: input.localPath,
      linkedAt: now,
    };

    saveAll([created, ...current]);
    return created;
  },

  markSynced(id: string): void {
    const current = readAll();
    const now = new Date().toISOString();
    saveAll(current.map((entry) => (entry.id === id ? { ...entry, lastSyncAt: now } : entry)));
  },
};
