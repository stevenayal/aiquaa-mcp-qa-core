import { z } from "zod";
import { ConfigurationError } from "../errors/index.js";
import { ok, err, type Result } from "../result/index.js";
import type { QaCoreConfig } from "./types.js";

const configSchema = z.object({
  logging: z.object({
    level: z.enum(["debug", "info", "warn", "error"]),
  }),
  github: z
    .object({
      token: z.string().min(1).optional(),
      apiUrl: z.string().url().optional(),
    })
    .optional(),
  aiquaa: z
    .object({
      apiBaseUrl: z.string().url().optional(),
      accessToken: z.string().min(1).optional(),
    })
    .optional(),
  codeGraph: z
    .object({
      bin: z.string().min(1),
      allowedRoots: z.array(z.string().min(1)),
    })
    .optional(),
  memory: z
    .object({
      bin: z.string().min(1),
      projectPrefix: z.string().min(1),
    })
    .optional(),
  security: z.object({
    allowedRoots: z.array(z.string().min(1)),
    maxFileSizeBytes: z.number().int().positive(),
    dryRun: z.boolean(),
  }),
});

export function validateConfig(config: QaCoreConfig): Result<QaCoreConfig, ConfigurationError> {
  const parsed = configSchema.safeParse(config);
  if (!parsed.success) {
    return err(
      new ConfigurationError("Invalid QaCoreConfig.", {
        details: { issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })) },
      }),
    );
  }
  return ok(parsed.data as QaCoreConfig);
}
