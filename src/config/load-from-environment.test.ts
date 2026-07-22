import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfigFromEnvironment } from "./load-from-environment.js";

describe("loadConfigFromEnvironment", () => {
  it("applies defaults when nothing is set", () => {
    const config = loadConfigFromEnvironment({});
    expect(config.logging.level).toBe("info");
    expect(config.security.dryRun).toBe(true);
    expect(config.security.allowedRoots).toEqual([]);
    expect(config.github).toBeUndefined();
  });

  it("reads GitHub, AIQUAA, CodeGraph and Engram settings", () => {
    const config = loadConfigFromEnvironment({
      GITHUB_TOKEN: "ghp_x",
      GITHUB_API_URL: "https://api.github.com",
      AIQUAA_API_BASE_URL: "https://aiquaa.example.com",
      AIQUAA_ACCESS_TOKEN: "jwt",
      CODEGRAPH_BIN: "codegraph",
      CODEGRAPH_ALLOWED_ROOTS: ["a", "b"].join(path.delimiter),
      ENGRAM_BIN: "engram",
      ENGRAM_PROJECT_PREFIX: "proj-",
      QA_CORE_LOG_LEVEL: "debug",
      QA_CORE_DRY_RUN: "false",
      QA_CORE_MAX_FILE_SIZE: "1024",
      QA_CORE_ALLOWED_ROOTS: "root",
    });

    expect(config.github).toEqual({ token: "ghp_x", apiUrl: "https://api.github.com" });
    expect(config.aiquaa).toEqual({ apiBaseUrl: "https://aiquaa.example.com", accessToken: "jwt" });
    expect(config.codeGraph?.bin).toBe("codegraph");
    expect(config.codeGraph?.allowedRoots).toHaveLength(2);
    expect(config.memory).toEqual({ bin: "engram", projectPrefix: "proj-" });
    expect(config.logging.level).toBe("debug");
    expect(config.security.dryRun).toBe(false);
    expect(config.security.maxFileSizeBytes).toBe(1024);
    expect(config.security.allowedRoots).toEqual(["root"]);
  });

  it("falls back to sensible defaults for invalid log level", () => {
    const config = loadConfigFromEnvironment({ QA_CORE_LOG_LEVEL: "verbose" });
    expect(config.logging.level).toBe("info");
  });
});
