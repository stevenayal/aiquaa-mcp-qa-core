import { describe, expect, it } from "vitest";
import {
  sourceReferenceSchema,
  requirementSchema,
  acceptanceCriterionSchema,
  businessRuleSchema,
  testScenarioSchema,
  automationArtifactSchema,
} from "./domain.schemas.js";

describe("domain schemas", () => {
  it("validates a well-formed SourceReference", () => {
    expect(sourceReferenceSchema.safeParse({ kind: "requirement", confidence: "high" }).success).toBe(true);
    expect(sourceReferenceSchema.safeParse({ kind: "not-a-kind", confidence: "high" }).success).toBe(false);
  });

  it("validates a well-formed Requirement with nested acceptance criteria", () => {
    const result = requirementSchema.safeParse({
      id: "req-1",
      title: "Login",
      description: "User can log in",
      type: "functional",
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
      businessRuleIds: [],
      tags: [],
      sourceReferences: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a Requirement missing required fields", () => {
    expect(requirementSchema.safeParse({ title: "Login" }).success).toBe(false);
  });

  it("validates AcceptanceCriterion, BusinessRule, TestScenario and AutomationArtifact", () => {
    expect(
      acceptanceCriterionSchema.safeParse({
        id: "ac-1",
        requirementId: "req-1",
        description: "d",
        preconditions: [],
        tags: [],
        sourceReferences: [],
      }).success,
    ).toBe(true);

    expect(
      businessRuleSchema.safeParse({ id: "rule-1", title: "t", description: "d", sourceReferences: [] }).success,
    ).toBe(true);

    expect(
      testScenarioSchema.safeParse({
        id: "scn-1",
        name: "n",
        type: "positive",
        requirementIds: [],
        acceptanceCriterionIds: [],
        businessRuleIds: [],
        artifactIds: [],
        sourceReferences: [],
      }).success,
    ).toBe(true);

    expect(
      automationArtifactSchema.safeParse({
        id: "art-1",
        kind: "generic_test",
        name: "n",
        scenarioIds: [],
        metadata: {},
        sourceReferences: [],
      }).success,
    ).toBe(true);
  });
});
