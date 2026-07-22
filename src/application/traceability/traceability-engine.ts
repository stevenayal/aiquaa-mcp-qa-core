import type { Requirement } from "../../domain/requirements/requirement.js";
import type { AcceptanceCriterion } from "../../domain/acceptance-criteria/acceptance-criterion.js";
import type { BusinessRule } from "../../domain/business-rules/business-rule.js";
import type { TestScenario } from "../../domain/scenarios/test-scenario.js";
import type { AutomationArtifact } from "../../domain/artifacts/automation-artifact.js";
import type { ExecutionResult } from "../../domain/execution/execution-result.js";
import type { Evidence } from "../../domain/evidence/evidence.js";
import type {
  TraceabilityGraph,
  TraceabilityLink,
  TraceableEntityType,
} from "../../domain/traceability/types.js";

export interface TraceabilityGraphInput {
  requirements: Requirement[];
  businessRules?: BusinessRule[];
  scenarios: TestScenario[];
  artifacts: AutomationArtifact[];
  executionResults?: ExecutionResult[];
  evidence?: Evidence[];
}

export interface BrokenLink {
  link: TraceabilityLink;
  reason: string;
}

function link(
  fromType: TraceableEntityType,
  fromId: string,
  toType: TraceableEntityType,
  toId: string,
  relation: TraceabilityLink["relation"],
): TraceabilityLink {
  return { fromType, fromId, toType, toId, relation, sourceReferences: [] };
}

/** Builds the full requirement → evidence traceability graph from raw domain collections. */
export function buildTraceabilityGraph(input: TraceabilityGraphInput): TraceabilityGraph {
  const links: TraceabilityLink[] = [];
  const allCriteria: AcceptanceCriterion[] = [];

  for (const requirement of input.requirements) {
    for (const criterion of requirement.acceptanceCriteria) {
      allCriteria.push(criterion);
      links.push(link("acceptance_criterion", criterion.id, "requirement", requirement.id, "derived_from"));
    }
    for (const ruleId of requirement.businessRuleIds) {
      links.push(link("requirement", requirement.id, "business_rule", ruleId, "depends_on"));
    }
  }

  for (const scenario of input.scenarios) {
    for (const requirementId of scenario.requirementIds) {
      links.push(link("test_scenario", scenario.id, "requirement", requirementId, "verifies"));
    }
    for (const criterionId of scenario.acceptanceCriterionIds) {
      links.push(link("test_scenario", scenario.id, "acceptance_criterion", criterionId, "verifies"));
    }
    for (const ruleId of scenario.businessRuleIds) {
      links.push(link("test_scenario", scenario.id, "business_rule", ruleId, "covers"));
    }
  }

  for (const artifact of input.artifacts) {
    for (const scenarioId of artifact.scenarioIds) {
      links.push(link("automation_artifact", artifact.id, "test_scenario", scenarioId, "implements"));
    }
  }

  for (const execution of input.executionResults ?? []) {
    links.push(link("execution_result", execution.id, "test_scenario", execution.scenarioId, "verifies"));
    if (execution.artifactId) {
      links.push(
        link("execution_result", execution.id, "automation_artifact", execution.artifactId, "executed_by"),
      );
    }
  }

  for (const item of input.evidence ?? []) {
    if (item.relatedEntityType === "execution_result") {
      links.push(link("execution_result", item.relatedEntityId, "evidence", item.id, "produced"));
    }
  }

  return { links };
}

export function findCoverageForRequirement(graph: TraceabilityGraph, requirementId: string): TraceabilityLink[] {
  const directCriteriaIds = new Set(
    graph.links
      .filter((l) => l.toType === "requirement" && l.toId === requirementId && l.relation === "derived_from")
      .map((l) => l.fromId),
  );

  return graph.links.filter((l) => {
    if (l.toType === "requirement" && l.toId === requirementId) return true;
    if (l.toType === "acceptance_criterion" && directCriteriaIds.has(l.toId)) return true;
    return false;
  });
}

export function findArtifactsForRule(graph: TraceabilityGraph, ruleId: string): string[] {
  const scenarioIds = new Set(
    graph.links
      .filter((l) => l.fromType === "test_scenario" && l.toType === "business_rule" && l.toId === ruleId)
      .map((l) => l.fromId),
  );
  const artifactIds = new Set(
    graph.links
      .filter((l) => l.fromType === "automation_artifact" && l.toType === "test_scenario" && scenarioIds.has(l.toId))
      .map((l) => l.fromId),
  );
  return [...artifactIds];
}

export function findOrphanArtifacts(graph: TraceabilityGraph, artifacts: AutomationArtifact[]): AutomationArtifact[] {
  const linkedArtifactIds = new Set(
    graph.links.filter((l) => l.fromType === "automation_artifact").map((l) => l.fromId),
  );
  return artifacts.filter((artifact) => !linkedArtifactIds.has(artifact.id));
}

export function findUncoveredCriteria(
  graph: TraceabilityGraph,
  criteria: AcceptanceCriterion[],
): AcceptanceCriterion[] {
  const coveredCriterionIds = new Set(
    graph.links
      .filter((l) => l.toType === "acceptance_criterion" && l.relation === "verifies")
      .map((l) => l.toId),
  );
  return criteria.filter((criterion) => !coveredCriterionIds.has(criterion.id));
}

export function findBrokenLinks(
  graph: TraceabilityGraph,
  knownIdsByType: Partial<Record<TraceableEntityType, Set<string>>>,
): BrokenLink[] {
  const broken: BrokenLink[] = [];
  for (const candidate of graph.links) {
    const fromKnown = knownIdsByType[candidate.fromType];
    if (fromKnown && !fromKnown.has(candidate.fromId)) {
      broken.push({ link: candidate, reason: `Unknown ${candidate.fromType} id "${candidate.fromId}".` });
      continue;
    }
    const toKnown = knownIdsByType[candidate.toType];
    if (toKnown && !toKnown.has(candidate.toId)) {
      broken.push({ link: candidate, reason: `Unknown ${candidate.toType} id "${candidate.toId}".` });
    }
  }
  return broken;
}

export function mergeTraceabilityGraphs(graphs: TraceabilityGraph[]): TraceabilityGraph {
  const seen = new Set<string>();
  const links: TraceabilityLink[] = [];
  for (const graph of graphs) {
    for (const candidate of graph.links) {
      const key = `${candidate.fromType}:${candidate.fromId}>${candidate.relation}>${candidate.toType}:${candidate.toId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(candidate);
    }
  }
  return { links };
}

export function serializeTraceabilityGraph(graph: TraceabilityGraph): string {
  return JSON.stringify(graph, null, 2);
}

export class TraceabilityEngine {
  build(input: TraceabilityGraphInput): TraceabilityGraph {
    return buildTraceabilityGraph(input);
  }

  findCoverageForRequirement(graph: TraceabilityGraph, requirementId: string): TraceabilityLink[] {
    return findCoverageForRequirement(graph, requirementId);
  }

  findArtifactsForRule(graph: TraceabilityGraph, ruleId: string): string[] {
    return findArtifactsForRule(graph, ruleId);
  }

  findOrphanArtifacts(graph: TraceabilityGraph, artifacts: AutomationArtifact[]): AutomationArtifact[] {
    return findOrphanArtifacts(graph, artifacts);
  }

  findUncoveredCriteria(graph: TraceabilityGraph, criteria: AcceptanceCriterion[]): AcceptanceCriterion[] {
    return findUncoveredCriteria(graph, criteria);
  }

  findBrokenLinks(
    graph: TraceabilityGraph,
    knownIdsByType: Partial<Record<TraceableEntityType, Set<string>>>,
  ): BrokenLink[] {
    return findBrokenLinks(graph, knownIdsByType);
  }

  merge(graphs: TraceabilityGraph[]): TraceabilityGraph {
    return mergeTraceabilityGraphs(graphs);
  }

  serialize(graph: TraceabilityGraph): string {
    return serializeTraceabilityGraph(graph);
  }
}
