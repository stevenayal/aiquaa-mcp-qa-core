import type { QaCoreConfig } from "./types.js";

export function createDefaultConfig(): QaCoreConfig {
  return {
    logging: { level: "info" },
    security: {
      allowedRoots: [],
      maxFileSizeBytes: 2 * 1024 * 1024,
      dryRun: true,
    },
  };
}
