import { createHash } from "node:crypto";

export interface StableIdOptions {
  /** External/business id from the source system — normalized and reused verbatim when present. */
  externalId?: string;
  /** Deterministic seed (e.g. requirement title + description) hashed when no externalId is given. */
  seed?: string;
  /** Hex length of the hashed suffix. Defaults to 10. */
  length?: number;
}

function hashSlice(input: string, length: number): string {
  return createHash("sha256").update(input).digest("hex").slice(0, length);
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Same externalId or seed always yields the same id — callers must not see
 * ids drift across runs for identical input.
 */
function buildId(prefix: string, options: StableIdOptions): string {
  const length = options.length ?? 10;
  const externalId = options.externalId?.trim();
  if (externalId) {
    const normalized = normalize(externalId).slice(0, 40);
    return `${prefix}-${normalized || hashSlice(externalId, length)}`;
  }
  const seed = options.seed?.trim();
  if (seed) {
    return `${prefix}-${hashSlice(seed, length)}`;
  }
  return `${prefix}-${hashSlice(`${prefix}:${Date.now()}:${Math.random()}`, length)}`;
}

export function generateRequirementId(options: StableIdOptions = {}): string {
  return buildId("req", options);
}

export function generateAcceptanceCriterionId(options: StableIdOptions = {}): string {
  return buildId("ac", options);
}

export function generateBusinessRuleId(options: StableIdOptions = {}): string {
  return buildId("rule", options);
}

export function generateScenarioId(options: StableIdOptions = {}): string {
  return buildId("scn", options);
}

export function generateArtifactId(options: StableIdOptions = {}): string {
  return buildId("art", options);
}

export function generateOperationId(options: StableIdOptions = {}): string {
  return buildId("op", options);
}
