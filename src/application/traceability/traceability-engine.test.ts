import { describe, expect, it } from "vitest";
import type { Requirement } from "../../domain/requirements/requirement.js";
import type { TestScenario } from "../../domain/scenarios/test-scenario.js";
import type { AutomationArtifact } from "../../domain/artifacts/automation-artifact.js";
import {
  TraceabilityEngine,
  buildTraceabilityGraph,
  findArtifactsForRule,
  findBrokenLinks,
  findCoverageForRequirement,
  findOrphanArtifacts,
  findUncoveredCriteria,
  mergeTraceabilityGraphs,
  serializeTraceabilityGraph,
} from "./traceability-engine.js";

function requirement(): Requirement {
  return {
    id: "req-1",
    title: "Login",
    description: "d",
    type: "functional",
    businessRuleIds: ["rule-1"],
    tags: [],
    sourceReferences: [],
    acceptanceCriteria: [
      {
        id: "ac-1",
        requirementId: "req-1",
        description: "Shows error",
        preconditions: [],
        tags: [],
        sourceReferences: [],
      },
    ],
  };
}

function scenario(): TestScenario {
  return {
    id: "scn-1",
    name: "Login fails with bad password",
    type: "negative",
    requirementIds: ["req-1"],
    acceptanceCriterionIds: ["ac-1"],
    businessRuleIds: ["rule-1"],
    artifactIds: [],
    sourceReferences: [],
  };
}

function artifact(): AutomationArtifact {
  return {
    id: "art-1",
    kind: "generic_test",
    name: "login.spec",
    scenarioIds: ["scn-1"],
    metadata: {},
    sourceReferences: [],
  };
}

describe("TraceabilityEngine", () => {
  it("builds derived_from/verifies/covers/implements links", () => {
    const graph = buildTraceabilityGraph({
      requirements: [requirement()],
      scenarios: [scenario()],
      artifacts: [artifact()],
    });

    expect(graph.links).toContainEqual(
      expect.objectContaining({ fromType: "acceptance_criterion", toType: "requirement", relation: "derived_from" }),
    );
    expect(graph.links).toContainEqual(
      expect.objectContaining({ fromType: "test_scenario", toType: "acceptance_criterion", relation: "verifies" }),
    );
    expect(graph.links).toContainEqual(
      expect.objectContaining({ fromType: "test_scenario", toType: "business_rule", relation: "covers" }),
    );
    expect(graph.links).toContainEqual(
      expect.objectContaining({ fromType: "automation_artifact", toType: "test_scenario", relation: "implements" }),
    );
  });

  it("finds coverage links for a requirement, including via its acceptance criteria", () => {
    const graph = buildTraceabilityGraph({ requirements: [requirement()], scenarios: [scenario()], artifacts: [] });
    const links = findCoverageForRequirement(graph, "req-1");
    expect(links.some((l) => l.fromType === "test_scenario" && l.toType === "acceptance_criterion")).toBe(true);
  });

  it("finds artifacts implementing scenarios that cover a business rule", () => {
    const graph = buildTraceabilityGraph({
      requirements: [requirement()],
      scenarios: [scenario()],
      artifacts: [artifact()],
    });
    expect(findArtifactsForRule(graph, "rule-1")).toEqual(["art-1"]);
  });

  it("finds orphan artifacts not linked to any scenario", () => {
    const linked = artifact();
    const orphan: AutomationArtifact = { ...artifact(), id: "art-orphan", scenarioIds: [] };
    const graph = buildTraceabilityGraph({ requirements: [], scenarios: [], artifacts: [linked, orphan] });
    expect(findOrphanArtifacts(graph, [linked, orphan])).toEqual([orphan]);
  });

  it("finds acceptance criteria with no verifying scenario", () => {
    const req = requirement();
    const graph = buildTraceabilityGraph({ requirements: [req], scenarios: [], artifacts: [] });
    expect(findUncoveredCriteria(graph, req.acceptanceCriteria)).toEqual(req.acceptanceCriteria);
  });

  it("finds broken links pointing at unknown ids", () => {
    const graph = buildTraceabilityGraph({ requirements: [requirement()], scenarios: [scenario()], artifacts: [] });
    const broken = findBrokenLinks(graph, { requirement: new Set(["req-other"]) });
    expect(broken.length).toBeGreaterThan(0);
  });

  it("merges graphs and de-duplicates identical links", () => {
    const graph = buildTraceabilityGraph({ requirements: [requirement()], scenarios: [], artifacts: [] });
    const merged = mergeTraceabilityGraphs([graph, graph]);
    expect(merged.links).toHaveLength(graph.links.length);
  });

  it("serializes to JSON", () => {
    const graph = buildTraceabilityGraph({ requirements: [requirement()], scenarios: [], artifacts: [] });
    expect(() => JSON.parse(serializeTraceabilityGraph(graph))).not.toThrow();
  });

  it("exposes the same behavior through the class API", () => {
    const engine = new TraceabilityEngine();
    const graph = engine.build({ requirements: [requirement()], scenarios: [scenario()], artifacts: [artifact()] });
    expect(engine.findArtifactsForRule(graph, "rule-1")).toEqual(["art-1"]);
    expect(engine.merge([graph]).links).toEqual(graph.links);
    expect(engine.serialize(graph)).toBe(serializeTraceabilityGraph(graph));
  });
});
