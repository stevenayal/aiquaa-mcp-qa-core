import { describe, expect, it } from "vitest";
import { normalizeRequirements, normalizeRequirement } from "./normalize-requirements.js";

describe("normalizeRequirements", () => {
  it("assigns a stable id derived from externalId", () => {
    const [requirement] = normalizeRequirements([
      { externalId: "REQ-42", title: "Login", description: "User can log in" },
    ]);
    expect(requirement?.id).toBe("req-req-42");
    expect(requirement?.type).toBe("functional");
    expect(requirement?.acceptanceCriteria).toEqual([]);
  });

  it("produces the same id for the same title+description when no externalId is given", () => {
    const a = normalizeRequirement({ title: "Login", description: "User can log in" });
    const b = normalizeRequirement({ title: "Login", description: "User can log in" });
    expect(a.id).toBe(b.id);
  });

  it("normalizes nested acceptance criteria with requirementId back-references", () => {
    const [requirement] = normalizeRequirements([
      {
        title: "Login",
        description: "User can log in",
        acceptanceCriteria: [{ description: "Shows error on bad password" }],
      },
    ]);
    expect(requirement?.acceptanceCriteria).toHaveLength(1);
    expect(requirement?.acceptanceCriteria[0]?.requirementId).toBe(requirement?.id);
  });

  it("preserves explicit ids instead of regenerating them", () => {
    const requirement = normalizeRequirement({ id: "req-fixed", title: "T", description: "D" });
    expect(requirement.id).toBe("req-fixed");
  });

  it("defaults arrays to empty when not provided", () => {
    const requirement = normalizeRequirement({ title: "T", description: "D" });
    expect(requirement.businessRuleIds).toEqual([]);
    expect(requirement.tags).toEqual([]);
    expect(requirement.sourceReferences).toEqual([]);
  });
});
