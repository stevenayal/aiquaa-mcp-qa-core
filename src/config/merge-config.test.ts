import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "./default-config.js";
import { mergeConfig } from "./merge-config.js";

describe("mergeConfig", () => {
  it("overrides fields section by section", () => {
    const base = createDefaultConfig();
    const merged = mergeConfig(base, { logging: { level: "debug" } });
    expect(merged.logging.level).toBe("debug");
    expect(merged.security).toEqual(base.security);
  });

  it("keeps optional sections undefined unless overridden", () => {
    const base = createDefaultConfig();
    const merged = mergeConfig(base, {});
    expect(merged.github).toBeUndefined();
  });

  it("merges nested optional sections instead of replacing wholesale", () => {
    const base = createDefaultConfig();
    base.github = { token: "old" };
    const merged = mergeConfig(base, { github: { apiUrl: "https://api.github.com" } });
    expect(merged.github).toEqual({ token: "old", apiUrl: "https://api.github.com" });
  });
});
