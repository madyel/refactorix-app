import { beforeEach, describe, expect, it } from "vitest";
import { COPILOT_SETTINGS_STORAGE_KEY, loadCopilotSettings, saveCopilotSettings } from "@/features/copilot/settings";

describe("copilot settings storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and normalizes url/token", () => {
    const saved = saveCopilotSettings({ apiBaseUrl: "localhost:8000/", apiToken: "  token-1 " });

    expect(saved).toEqual({
      apiBaseUrl: "http://localhost:8000",
      apiToken: "token-1",
      apiKey: undefined,
      bootstrapRole: "operator",
      bootstrapSubject: "smart-ide",
    });

    const stored = window.localStorage.getItem(COPILOT_SETTINGS_STORAGE_KEY);
    expect(stored).toContain("localhost:8000");
  });

  it("drops invalid base url values", () => {
    const saved = saveCopilotSettings({ apiBaseUrl: "not-a-url" });
    expect(saved.apiBaseUrl).toBeUndefined();
  });

  it("loads empty object when value is corrupted", () => {
    window.localStorage.setItem(COPILOT_SETTINGS_STORAGE_KEY, "{bad-json");
    expect(loadCopilotSettings()).toEqual({});
  });
});
