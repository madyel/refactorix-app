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
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: "abc",
            refreshToken: "refresh-1",
            tokenType: "Bearer",
            expiresAt: Date.now() + 300_000,
          }),
          { status: 200 },
        ),
      );

    const session = await bootstrapAuthSession();

    expect(session?.accessToken).toBe("abc");
    expect(loadAuthSession()?.accessToken).toBe("abc");
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/session/token?role=operator&subject=smart-ide",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-api-key": "key" }),
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
        headers: expect.objectContaining({ Authorization: "Bearer refresh" }),
      }),
    );
    expect(loadAuthSession()?.refreshToken).toBe("new-r");
  });

  it("returns current valid token without refresh", async () => {
    saveAuthSession({ accessToken: "ok", tokenType: "Bearer", expiresAt: Date.now() + 999999 });
    const token = await getValidAccessToken();
    expect(token).toBe("ok");
    clearAuthSession();
  });
});
