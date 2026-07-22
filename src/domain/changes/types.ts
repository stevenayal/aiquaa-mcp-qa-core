import type { SourceReference } from "../source-reference.js";

export type ChangeDecision = "create" | "extend" | "modify" | "keep" | "deprecate" | "delete" | "block";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface PlannedChange {
  id: string;
  decision: ChangeDecision;
  targetPath?: string;
  artifactId?: string;
  reason: string;
  requirementIds: string[];
  businessRuleIds: string[];
  risk: RiskLevel;
  dependencies: string[];
  sourceReferences: SourceReference[];
}

export type ChangePlanStrategy = "create" | "extend" | "modify" | "mixed" | "keep" | "block";

export interface ChangePlan {
  strategy: ChangePlanStrategy;
  changes: PlannedChange[];
  coverageBefore?: number;
  coverageAfterEstimated?: number;
  assumptions: string[];
  warnings: string[];
  blockedReasons: string[];
}

/** A candidate proposed by a plugin, before the planner applies its safety rules. */
export interface ChangeCandidate {
  targetPath?: string;
  artifactId?: string;
  decision: ChangeDecision;
  reason: string;
  requirementIds: string[];
  businessRuleIds: string[];
  risk: RiskLevel;
  dependencies?: string[];
  sourceReferences?: SourceReference[];
  /** Must be true before "modify" or "delete" is accepted — enforces read-before-write. */
  hasReadExistingContent?: boolean;
}

export interface ChangePlanInput {
  candidates: ChangeCandidate[];
  existingArtifactPaths: string[];
  requestedScope: string[];
  coverageBefore?: number;
  coverageAfterEstimated?: number;
}
