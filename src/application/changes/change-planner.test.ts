import { describe, expect, it } from "vitest";
import type { ChangeCandidate } from "../../domain/changes/types.js";
import { ChangePlanner } from "./change-planner.js";

function candidate(overrides: Partial<ChangeCandidate> = {}): ChangeCandidate {
  return {
    targetPath: "tests/new.spec.ts",
    decision: "create",
    reason: "cover new requirement",
    requirementIds: ["req-1"],
    businessRuleIds: [],
    risk: "low",
    ...overrides,
  };
}

describe("ChangePlanner", () => {
  const planner = new ChangePlanner();

  it("accepts a well-evidenced, in-scope create", () => {
    const plan = planner.plan({
      candidates: [candidate()],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.strategy).toBe("create");
    expect(plan.changes[0]?.decision).toBe("create");
    expect(plan.blockedReasons).toEqual([]);
  });

  it("blocks a create that duplicates an existing artifact path", () => {
    const plan = planner.plan({
      candidates: [candidate({ targetPath: "tests/existing.spec.ts" })],
      existingArtifactPaths: ["tests/existing.spec.ts"],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("block");
    expect(plan.blockedReasons.length).toBe(1);
  });

  it("blocks a modify/delete that has not read existing content first", () => {
    const plan = planner.plan({
      candidates: [candidate({ decision: "modify", hasReadExistingContent: false })],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("block");
  });

  it("allows modify when existing content has been read", () => {
    const plan = planner.plan({
      candidates: [candidate({ decision: "modify", hasReadExistingContent: true })],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("modify");
  });

  it("blocks a delete without justification", () => {
    const plan = planner.plan({
      candidates: [candidate({ decision: "delete", hasReadExistingContent: true, reason: "   " })],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("block");
  });

  it("blocks a change outside the requested scope", () => {
    const plan = planner.plan({
      candidates: [candidate({ targetPath: "src/app.ts" })],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("block");
  });

  it("blocks a change with no requirement/rule evidence", () => {
    const plan = planner.plan({
      candidates: [candidate({ requirementIds: [], businessRuleIds: [] })],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("block");
  });

  it("does not block a keep decision even without evidence", () => {
    const plan = planner.plan({
      candidates: [candidate({ decision: "keep", requirementIds: [], businessRuleIds: [] })],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("keep");
    expect(plan.strategy).toBe("keep");
  });

  it("reports a coverage-drop warning without blocking", () => {
    const plan = planner.plan({
      candidates: [candidate()],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
      coverageBefore: 80,
      coverageAfterEstimated: 60,
    });
    expect(plan.warnings.some((w) => w.includes("80%"))).toBe(true);
  });

  it("derives a mixed strategy when decisions differ", () => {
    const plan = planner.plan({
      candidates: [candidate(), candidate({ decision: "keep", targetPath: "tests/keep.spec.ts" })],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.strategy).toBe("mixed");
  });

  it("prevents duplicate creates within the same plan", () => {
    const plan = planner.plan({
      candidates: [candidate(), candidate()],
      existingArtifactPaths: [],
      requestedScope: ["tests"],
    });
    expect(plan.changes[0]?.decision).toBe("create");
    expect(plan.changes[1]?.decision).toBe("block");
  });
});
