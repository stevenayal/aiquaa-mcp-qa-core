import { describe, expect, it } from "vitest";
import { createQaCoreTestHarness } from "./qa-core-test-harness.js";
import type { QaToolPlugin } from "../core/plugin.js";

interface Input {
  path: string;
}
interface Analysis {
  path: string;
}

const plugin: QaToolPlugin<Input, Analysis, { path: string }> = {
  name: "harness-plugin",
  version: "1.0.0",
  canHandle: (input) => input.path.endsWith(".spec.ts"),
  async analyze(input) {
    return { path: input.path };
  },
  async evaluateCoverage() {
    return {
      items: [],
      summary: { total: 0, covered: 0, partiallyCovered: 0, uncovered: 0, blocked: 0, outdated: 0, percentage: 0 },
    };
  },
  async planChanges() {
    return { strategy: "create", changes: [], assumptions: [], warnings: [], blockedReasons: [] };
  },
  async generateArtifacts(plan) {
    return [{ path: `generated-${plan.strategy}.ts` }];
  },
};

describe("createQaCoreTestHarness", () => {
  it("seeds the in-memory filesystem and repository with the given files", async () => {
    const harness = createQaCoreTestHarness({ files: { "tests/existing.spec.ts": "test content" } });
    expect(await harness.fs.readFile("tests/existing.spec.ts")).toBe("test content");
    expect(await harness.repository.readFile("tests/existing.spec.ts")).toEqual({
      path: "tests/existing.spec.ts",
      content: "test content",
      encoding: "utf8",
    });
  });

  it("runs a plugin end-to-end through the harness", async () => {
    const harness = createQaCoreTestHarness({});
    const result = await harness.runPlugin(plugin, { path: "tests/new.spec.ts" });
    expect(result.artifacts).toEqual([{ path: "generated-create.ts" }]);
  });

  it("exposes an independent logger that records entries", async () => {
    const harness = createQaCoreTestHarness({});
    await harness.runPlugin(plugin, { path: "tests/new.spec.ts" });
    expect(harness.logger.entries.some((entry) => entry.message.includes("harness-plugin"))).toBe(true);
  });
});
