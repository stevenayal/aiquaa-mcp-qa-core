import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "../config/default-config.js";
import { createQaCore } from "./create-qa-core.js";
import type { QaToolPlugin } from "./plugin.js";
import { ValidationError } from "../errors/index.js";

interface ExampleInput {
  type: string;
}
interface ExampleAnalysis {
  seen: boolean;
}
interface ExampleArtifact {
  path: string;
}

function makePlugin(canHandle = true): QaToolPlugin<ExampleInput, ExampleAnalysis, ExampleArtifact> {
  return {
    name: "example",
    version: "1.0.0",
    canHandle: () => canHandle,
    async analyze() {
      return { seen: true };
    },
    async evaluateCoverage() {
      return { items: [], summary: { total: 0, covered: 0, partiallyCovered: 0, uncovered: 0, blocked: 0, outdated: 0, percentage: 0 } };
    },
    async planChanges() {
      return { strategy: "keep", changes: [], assumptions: [], warnings: [], blockedReasons: [] };
    },
    async generateArtifacts() {
      return [{ path: "generated.ts" }];
    },
  };
}

describe("createQaCore", () => {
  it("exposes requirements.normalize", () => {
    const qaCore = createQaCore({ config: createDefaultConfig() });
    const [requirement] = qaCore.requirements.normalize([{ title: "T", description: "D" }]);
    expect(requirement?.title).toBe("T");
  });

  it("createContext defaults dryRun from config.security.dryRun", () => {
    const qaCore = createQaCore({ config: createDefaultConfig() });
    const context = qaCore.createContext();
    expect(context.dryRun).toBe(true);
    expect(context.operationId).toBeTruthy();
  });

  it("createContext honors explicit overrides", () => {
    const qaCore = createQaCore({ config: createDefaultConfig() });
    const context = qaCore.createContext({ operationId: "fixed-id", dryRun: false });
    expect(context.operationId).toBe("fixed-id");
    expect(context.dryRun).toBe(false);
  });

  it("changes.plan delegates to ChangePlanner", () => {
    const qaCore = createQaCore({ config: createDefaultConfig() });
    const plan = qaCore.changes.plan({ candidates: [], existingArtifactPaths: [], requestedScope: [] });
    expect(plan.strategy).toBe("keep");
  });

  it("runPlugin runs the full analyze→coverage→plan→artifacts pipeline", async () => {
    const qaCore = createQaCore({ config: createDefaultConfig() });
    const result = await qaCore.runPlugin(makePlugin(), { type: "example" });
    expect(result.analysis).toEqual({ seen: true });
    expect(result.artifacts).toEqual([{ path: "generated.ts" }]);
  });

  it("runPlugin rejects input the plugin cannot handle", async () => {
    const qaCore = createQaCore({ config: createDefaultConfig() });
    await expect(qaCore.runPlugin(makePlugin(false), { type: "example" })).rejects.toBeInstanceOf(ValidationError);
  });
});
