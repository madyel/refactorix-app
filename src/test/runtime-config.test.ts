import { beforeEach, describe, expect, it } from "vitest";
import { getConfiguredApiBaseUrl, getRuntimeApiBaseUrl, setRuntimeApiBaseUrl } from "@/config/runtime-config";

describe("runtime api base url config", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and normalizes runtime base url", () => {
    const saved = setRuntimeApiBaseUrl("https://copilot.local/");

    expect(saved).toBe("https://copilot.local");
    expect(getRuntimeApiBaseUrl()).toBe("https://copilot.local");
  });

  it("uses runtime url when configured", () => {
    setRuntimeApiBaseUrl("https://copilot.runtime");
    expect(getConfiguredApiBaseUrl()).toBe("https://copilot.runtime");
  });
});
