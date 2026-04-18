interface DesktopWorkspaceApi {
  workspace?: {
    pickDirectory?: () => Promise<{ canceled?: boolean; path?: string }>;
  };
}

const getDesktopApi = (): DesktopWorkspaceApi | undefined =>
  typeof window !== "undefined" ? ((window as unknown as { desktop?: DesktopWorkspaceApi }).desktop as DesktopWorkspaceApi | undefined) : undefined;

export const pickWorkspaceDirectory = async (currentPath: string): Promise<string | null> => {
  const desktop = getDesktopApi();

  if (desktop?.workspace?.pickDirectory) {
    const result = await desktop.workspace.pickDirectory();
    if (result?.canceled || !result?.path) {
      return null;
    }
    return result.path;
  }

  if (typeof window === "undefined") return null;

  const manual = window.prompt("Inserisci il path workspace", currentPath || "/workspace");
  if (!manual) return null;
  const normalized = manual.trim();
  return normalized.length > 0 ? normalized : null;
};
