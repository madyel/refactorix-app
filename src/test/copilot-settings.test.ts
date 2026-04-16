import { beforeEach, describe, expect, it } from "vitest";
import { COPILOT_SETTINGS_STORAGE_KEY, loadCopilotSettings, saveCopilotSettings } from "@/features/copilot/settings";

describe("copilot settings storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and normalizes url/token", () => {
    const saved = saveCopilotSettings({ apiBaseUrl: "https://copilot.local/", apiToken: "  token-1 " });

    expect(saved).toEqual({ apiBaseUrl: "https://copilot.local", apiToken: "token-1" });

    const stored = window.localStorage.getItem(COPILOT_SETTINGS_STORAGE_KEY);
    expect(stored).toContain("copilot.local");
  });

  it("loads empty object when value is corrupted", () => {
    window.localStorage.setItem(COPILOT_SETTINGS_STORAGE_KEY, "{bad-json");
    expect(loadCopilotSettings()).toEqual({});
  });
});
