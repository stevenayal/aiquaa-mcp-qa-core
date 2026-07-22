import type { ChangePlan } from "../domain/changes/types.js";
import type { CoverageReport } from "../domain/coverage/types.js";
import type { QaCoreContext } from "./qa-core-context.js";

/**
 * Contract every consumer MCP (Playwright, Postman/Newman, JMeter, …) implements
 * to plug its tool-specific logic into the core's requirement→coverage→change
 * pipeline. The core never imports a concrete plugin — only this interface.
 */
export interface QaToolPlugin<TInput, TAnalysis, TArtifact> {
  readonly name: string;
  readonly version: string;

  canHandle(input: TInput): boolean;

  analyze(input: TInput, context: QaCoreContext): Promise<TAnalysis>;

  evaluateCoverage(analysis: TAnalysis, context: QaCoreContext): Promise<CoverageReport>;

  planChanges(analysis: TAnalysis, coverage: CoverageReport, context: QaCoreContext): Promise<ChangePlan>;

  generateArtifacts(plan: ChangePlan, context: QaCoreContext): Promise<TArtifact[]>;
}

export interface PluginRunResult<TAnalysis, TArtifact> {
  analysis: TAnalysis;
  coverage: CoverageReport;
  changePlan: ChangePlan;
  artifacts: TArtifact[];
}
