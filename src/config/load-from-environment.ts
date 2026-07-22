import path from "node:path";
import { createDefaultConfig } from "./default-config.js";
import type { LogLevelName, QaCoreConfig } from "./types.js";

export type EnvironmentSource = Record<string, string | undefined>;

const VALID_LOG_LEVELS: LogLevelName[] = ["debug", "info", "warn", "error"];

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return !["false", "0", "no", "off"].includes(value.trim().toLowerCase());
}

function parseLogLevel(value: string | undefined, fallback: LogLevelName): LogLevelName {
  const candidate = value?.trim().toLowerCase();
  return VALID_LOG_LEVELS.includes(candidate as LogLevelName) ? (candidate as LogLevelName) : fallback;
}

/**
 * Reads QA-core configuration from process.env-shaped input. This is the only
 * place in the package allowed to read environment variables directly —
 * domain and application code always receive QaCoreConfig by injection.
 */
export function loadConfigFromEnvironment(env: EnvironmentSource = process.env): QaCoreConfig {
  const defaults = createDefaultConfig();

  const config: QaCoreConfig = {
    logging: { level: parseLogLevel(env.QA_CORE_LOG_LEVEL, defaults.logging.level) },
    security: {
      allowedRoots: parseList(env.QA_CORE_ALLOWED_ROOTS),
      maxFileSizeBytes: env.QA_CORE_MAX_FILE_SIZE
        ? Number.parseInt(env.QA_CORE_MAX_FILE_SIZE, 10)
        : defaults.security.maxFileSizeBytes,
      dryRun: parseBoolean(env.QA_CORE_DRY_RUN, defaults.security.dryRun),
    },
  };

  if (env.GITHUB_TOKEN || env.GITHUB_API_URL) {
    config.github = {
      ...(env.GITHUB_TOKEN ? { token: env.GITHUB_TOKEN } : {}),
      ...(env.GITHUB_API_URL ? { apiUrl: env.GITHUB_API_URL } : {}),
    };
  }

  if (env.AIQUAA_API_BASE_URL || env.AIQUAA_ACCESS_TOKEN) {
    config.aiquaa = {
      ...(env.AIQUAA_API_BASE_URL ? { apiBaseUrl: env.AIQUAA_API_BASE_URL } : {}),
      ...(env.AIQUAA_ACCESS_TOKEN ? { accessToken: env.AIQUAA_ACCESS_TOKEN } : {}),
    };
  }

  if (env.CODEGRAPH_BIN || env.CODEGRAPH_ALLOWED_ROOTS) {
    config.codeGraph = {
      bin: env.CODEGRAPH_BIN?.trim() || "codegraph",
      allowedRoots: parseList(env.CODEGRAPH_ALLOWED_ROOTS),
    };
  }

  if (env.ENGRAM_BIN || env.ENGRAM_PROJECT_PREFIX) {
    config.memory = {
      bin: env.ENGRAM_BIN?.trim() || "engram",
      projectPrefix: env.ENGRAM_PROJECT_PREFIX?.trim() || "aiquaa-",
    };
  }

  return config;
}
