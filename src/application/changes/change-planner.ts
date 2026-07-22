import { generateOperationId } from "../../utils/ids.js";
import type {
  ChangeCandidate,
  ChangePlan,
  ChangePlanInput,
  ChangePlanStrategy,
  PlannedChange,
} from "../../domain/changes/types.js";

interface CandidateEvaluation {
  change: PlannedChange;
  warnings: string[];
  blockedReasons: string[];
}

function isInScope(targetPath: string, scope: string[]): boolean {
  if (scope.length === 0) return true;
  return scope.some((scoped) => targetPath === scoped || targetPath.startsWith(`${scoped}/`));
}

function deriveStrategy(changes: PlannedChange[]): ChangePlanStrategy {
  if (changes.length === 0) return "keep";
  const decisions = new Set(changes.map((change) => change.decision));
  if (decisions.size === 1) {
    const [only] = decisions;
    if (only === "create" || only === "extend" || only === "modify" || only === "keep" || only === "block") {
      return only;
    }
  }
  return "mixed";
}

/**
 * Turns plugin-proposed change candidates into a safe ChangePlan by applying
 * the core's non-negotiable rules (no duplicates, no blind overwrites, no
 * out-of-scope writes, no unjustified deletes, no unevidenced changes).
 */
export class ChangePlanner {
  plan(input: ChangePlanInput): ChangePlan {
    const changes: PlannedChange[] = [];
    const warnings: string[] = [];
    const blockedReasons: string[] = [];
    const assumptions: string[] = [];
    const seenTargetPaths = new Set<string>(input.existingArtifactPaths);

    for (const candidate of input.candidates) {
      const evaluation = this.evaluateCandidate(candidate, input, seenTargetPaths);
      changes.push(evaluation.change);
      warnings.push(...evaluation.warnings);
      blockedReasons.push(...evaluation.blockedReasons);
      if (evaluation.change.targetPath && evaluation.change.decision !== "block") {
        seenTargetPaths.add(evaluation.change.targetPath);
      }
    }

    if (
      input.coverageBefore !== undefined &&
      input.coverageAfterEstimated !== undefined &&
      input.coverageAfterEstimated < input.coverageBefore
    ) {
      warnings.push(
        `Estimated coverage would drop from ${input.coverageBefore}% to ${input.coverageAfterEstimated}%; review before applying.`,
      );
    }

    return {
      strategy: deriveStrategy(changes),
      changes,
      ...(input.coverageBefore !== undefined ? { coverageBefore: input.coverageBefore } : {}),
      ...(input.coverageAfterEstimated !== undefined
        ? { coverageAfterEstimated: input.coverageAfterEstimated }
        : {}),
      assumptions,
      warnings,
      blockedReasons,
    };
  }

  private evaluateCandidate(
    candidate: ChangeCandidate,
    input: ChangePlanInput,
    seenTargetPaths: Set<string>,
  ): CandidateEvaluation {
    const warnings: string[] = [];
    const blockedReasons: string[] = [];
    let decision = candidate.decision;
    let reason = candidate.reason;

    const label = candidate.targetPath ?? candidate.artifactId ?? "change";
    const hasEvidence = candidate.requirementIds.length > 0 || candidate.businessRuleIds.length > 0;

    if (decision !== "keep" && !hasEvidence) {
      decision = "block";
      reason = `Blocked: "${label}" has no requirement or business-rule evidence.`;
      blockedReasons.push(reason);
    }

    if (decision !== "block" && candidate.targetPath && !isInScope(candidate.targetPath, input.requestedScope)) {
      decision = "block";
      reason = `Blocked: "${candidate.targetPath}" is outside the requested scope.`;
      blockedReasons.push(reason);
    }

    if (decision === "create" && candidate.targetPath && seenTargetPaths.has(candidate.targetPath)) {
      decision = "block";
      reason = `Blocked: "${candidate.targetPath}" already exists — use "extend" or "modify" instead of duplicating.`;
      blockedReasons.push(reason);
    }

    if (
      decision !== "block" &&
      (decision === "modify" || decision === "delete") &&
      !candidate.hasReadExistingContent
    ) {
      decision = "block";
      reason = `Blocked: cannot ${candidate.decision} "${label}" without reading its current content first.`;
      blockedReasons.push(reason);
    }

    if (decision === "delete" && !candidate.reason.trim()) {
      decision = "block";
      reason = `Blocked: delete of "${label}" requires an explicit justification.`;
      blockedReasons.push(reason);
    }

    const change: PlannedChange = {
      id: generateOperationId({ seed: `${label}:${candidate.decision}:${candidate.reason}` }),
      decision,
      ...(candidate.targetPath ? { targetPath: candidate.targetPath } : {}),
      ...(candidate.artifactId ? { artifactId: candidate.artifactId } : {}),
      reason,
      requirementIds: candidate.requirementIds,
      businessRuleIds: candidate.businessRuleIds,
      risk: candidate.risk,
      dependencies: candidate.dependencies ?? [],
      sourceReferences: candidate.sourceReferences ?? [],
    };

    return { change, warnings, blockedReasons };
  }
}
