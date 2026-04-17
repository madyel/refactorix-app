import { describe, expect, it, vi } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handleWindowOpen, isSameAppOrigin, shouldOpenExternally } = require("../../electron/navigation.cjs");

describe("electron link navigation", () => {
  it("allows same-origin app links in dev", () => {
    expect(isSameAppOrigin("http://localhost:5173/project", "http://localhost:5173")).toBe(true);
    expect(shouldOpenExternally("http://localhost:5173/project", "http://localhost:5173")).toBe(false);
  });

  it("denies non-http protocols and opens trusted externals", () => {
    const openExternal = vi.fn();

    const externalResult = handleWindowOpen("https://example.com/docs", "http://localhost:5173", openExternal);
    const blockedResult = handleWindowOpen("javascript:alert(1)", "http://localhost:5173", openExternal);

    expect(externalResult).toEqual({ action: "deny" });
    expect(openExternal).toHaveBeenCalledWith("https://example.com/docs");
    expect(blockedResult).toEqual({ action: "deny" });
  });

  it("allows file protocol navigation in production app", () => {
    expect(isSameAppOrigin("file:///index.html#/project", "file://")).toBe(true);
  });
});
