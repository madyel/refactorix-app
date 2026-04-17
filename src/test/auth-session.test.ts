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
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "abc", expires_in: 300 }), { status: 200 }));

    const session = await bootstrapAuthSession();

    expect(session?.accessToken).toBe("abc");
    expect(loadAuthSession()?.accessToken).toBe("abc");
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/session/token",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-api-key": "key" }),
        body: JSON.stringify({ role: "operator", subject: "smart-ide" }),
      }),
    );
  });

  it("refreshes after unauthorized", async () => {
    saveAuthSession({ accessToken: "old", refreshToken: "refresh", tokenType: "Bearer", expiresAt: Date.now() - 1000 });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "new", refresh_token: "new-r", expires_in: 300 }), { status: 200 }));

    const token = await refreshAfterUnauthorized();

    expect(token).toBe("new");
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/session/refresh",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refresh_token: "refresh", refreshToken: "refresh" }),
      }),
    );
  });

  it("falls back to query contract when bootstrap body contract fails", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "from-query", expires_in: 300 }), { status: 200 }));

    const session = await bootstrapAuthSession();

    expect(session?.accessToken).toBe("from-query");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/v1/auth/session/token?role=operator&subject=smart-ide",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns current valid token without refresh", async () => {
    saveAuthSession({ accessToken: "ok", tokenType: "Bearer", expiresAt: Date.now() + 999999 });
    const token = await getValidAccessToken();
    expect(token).toBe("ok");
    clearAuthSession();
  });
});
