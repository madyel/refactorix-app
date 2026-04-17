import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapAuthSession, clearAuthSession, getValidAccessToken, loadAuthSession, refreshAfterUnauthorized, saveAuthSession } from "@/features/copilot/auth-session";
import { saveCopilotSettings } from "@/features/copilot/settings";

describe("auth session", () => {
  beforeEach(() => {
    window.localStorage.clear();
    saveCopilotSettings({ apiBaseUrl: "http://localhost:8000", apiKey: "key", bootstrapRole: "operator", bootstrapSubject: "smart-ide" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("bootstraps and persists access token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "abc", expires_in: 300 }), { status: 200 }));

    const session = await bootstrapAuthSession();

    expect(session?.accessToken).toBe("abc");
    expect(loadAuthSession()?.accessToken).toBe("abc");
  });

  it("refreshes after unauthorized", async () => {
    saveAuthSession({ accessToken: "old", refreshToken: "refresh", tokenType: "Bearer", expiresAt: Date.now() - 1000 });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "new", refresh_token: "new-r", expires_in: 300 }), { status: 200 }));

    const token = await refreshAfterUnauthorized();

    expect(token).toBe("new");
  });

  it("returns current valid token without refresh", async () => {
    saveAuthSession({ accessToken: "ok", tokenType: "Bearer", expiresAt: Date.now() + 999999 });
    const token = await getValidAccessToken();
    expect(token).toBe("ok");
    clearAuthSession();
  });
});
