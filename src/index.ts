// Domain
export type { SourceKind, ConfidenceLevel, SourceReference } from "./domain/source-reference.js";
export type { Requirement, RequirementType, Priority } from "./domain/requirements/requirement.js";
export type { AcceptanceCriterion } from "./domain/acceptance-criteria/acceptance-criterion.js";
export type { BusinessRule } from "./domain/business-rules/business-rule.js";
export type { TestScenario, TestScenarioType } from "./domain/scenarios/test-scenario.js";
export type { AutomationArtifact } from "./domain/artifacts/automation-artifact.js";
export type { ExecutionResult, ExecutionStatus } from "./domain/execution/execution-result.js";
export type { Evidence, EvidenceKind } from "./domain/evidence/evidence.js";

export {
  normalizeRequirements,
  normalizeRequirement,
  normalizeAcceptanceCriterion,
} from "./application/requirements/normalize-requirements.js";
export type { RawRequirement, RawAcceptanceCriterion } from "./application/requirements/normalize-requirements.js";

// Traceability
export type {
  TraceableEntityType,
  TraceabilityRelation,
  TraceabilityLink,
  TraceabilityGraph,
} from "./domain/traceability/types.js";
export {
  TraceabilityEngine,
  buildTraceabilityGraph,
  findCoverageForRequirement,
  findArtifactsForRule,
  findOrphanArtifacts,
  findUncoveredCriteria,
  findBrokenLinks,
  mergeTraceabilityGraphs,
  serializeTraceabilityGraph,
} from "./application/traceability/traceability-engine.js";
export type { TraceabilityGraphInput, BrokenLink } from "./application/traceability/traceability-engine.js";

// Coverage
export type {
  CoverageStatus,
  CoverageTargetType,
  CoverageItem,
  CoverageSummary,
  CoverageReport,
  CoverageEvaluationResult,
  CoverageEvaluator,
} from "./domain/coverage/types.js";
export { CoverageEngine, summarizeCoverageItems } from "./application/coverage/coverage-engine.js";

// Changes
export type {
  ChangeDecision,
  RiskLevel,
  PlannedChange,
  ChangePlanStrategy,
  ChangePlan,
  ChangeCandidate,
  ChangePlanInput,
} from "./domain/changes/types.js";
export { ChangePlanner } from "./application/changes/change-planner.js";

// Patches
export * from "./patches/index.js";

// Security
export * from "./security/index.js";

// Config
export * from "./config/index.js";

// Errors & result
export * from "./errors/index.js";
export * from "./result/index.js";

// Ports
export * from "./ports/index.js";

// Ids
export {
  generateRequirementId,
  generateAcceptanceCriterionId,
  generateBusinessRuleId,
  generateScenarioId,
  generateArtifactId,
  generateOperationId,
} from "./utils/ids.js";
export type { StableIdOptions } from "./utils/ids.js";

// Logging
export { ConsoleLoggerAdapter, NoopLoggerAdapter } from "./infrastructure/logging/index.js";
export type { ConsoleLoggerOptions, LogLevel } from "./infrastructure/logging/console-logger.adapter.js";

// MCP responses
export * from "./mcp/index.js";

// Core / plugin system
export { createQaCore } from "./core/create-qa-core.js";
export type { CreateQaCoreOptions, CreateContextOptions, QaCore } from "./core/create-qa-core.js";
export type { QaCoreContext } from "./core/qa-core-context.js";
export type { QaToolPlugin, PluginRunResult } from "./core/plugin.js";

// Schemas
export * from "./schemas/index.js";
