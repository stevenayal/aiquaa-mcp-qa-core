import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "./default-config.js";
import { validateConfig } from "./validate-config.js";

describe("validateConfig", () => {
  it("accepts the default config", () => {
    const result = validateConfig(createDefaultConfig());
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid log level", () => {
    const config = createDefaultConfig();
    // @ts-expect-error intentionally invalid for the test
    config.logging.level = "verbose";
    const result = validateConfig(config);
    expect(result.ok).toBe(false);
  });

  it("rejects a malformed AIQUAA base URL", () => {
    const config = createDefaultConfig();
    config.aiquaa = { apiBaseUrl: "not-a-url" };
    const result = validateConfig(config);
    expect(result.ok).toBe(false);
  });
});
