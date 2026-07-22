import { describe, expect, it } from "vitest";
import {
  generateRequirementId,
  generateAcceptanceCriterionId,
  generateBusinessRuleId,
  generateScenarioId,
  generateArtifactId,
  generateOperationId,
} from "./ids.js";

describe("stable id generation", () => {
  it("is deterministic for the same externalId", () => {
    const a = generateRequirementId({ externalId: "REQ-1" });
    const b = generateRequirementId({ externalId: "REQ-1" });
    expect(a).toBe(b);
    expect(a.startsWith("req-")).toBe(true);
  });

  it("is deterministic for the same seed", () => {
    const a = generateBusinessRuleId({ seed: "same seed" });
    const b = generateBusinessRuleId({ seed: "same seed" });
    expect(a).toBe(b);
  });

  it("differs for different seeds", () => {
    const a = generateScenarioId({ seed: "one" });
    const b = generateScenarioId({ seed: "two" });
    expect(a).not.toBe(b);
  });

  it("uses the expected prefix per entity type", () => {
    expect(generateAcceptanceCriterionId({ seed: "x" }).startsWith("ac-")).toBe(true);
    expect(generateArtifactId({ seed: "x" }).startsWith("art-")).toBe(true);
    expect(generateOperationId({ seed: "x" }).startsWith("op-")).toBe(true);
  });

  it("falls back to a random id when no externalId or seed is given", () => {
    const a = generateOperationId();
    const b = generateOperationId();
    expect(a).not.toBe(b);
  });
});
