import { describe, expect, it } from "vitest";
import { InMemoryAiquaaAdapter } from "./in-memory-aiquaa.adapter.js";

describe("InMemoryAiquaaAdapter", () => {
  it("records saved coverage, executions and pull request links", async () => {
    const adapter = new InMemoryAiquaaAdapter();
    await adapter.saveCoverage({ projectId: "p1", operationId: "op1", coverage: { ok: true } });
    await adapter.saveExecution({ projectId: "p1", operationId: "op1", execution: { ok: true } });
    await adapter.linkPullRequest({ projectId: "p1", requirementIds: ["req-1"], pullRequestUrl: "https://x" });

    expect(adapter.state.savedCoverage).toHaveLength(1);
    expect(adapter.state.savedExecutions).toHaveLength(1);
    expect(adapter.state.linkedPullRequests).toHaveLength(1);
  });

  it("returns undefined/empty for unknown projects", async () => {
    const adapter = new InMemoryAiquaaAdapter();
    expect(await adapter.getProject("missing")).toBeUndefined();
    expect(await adapter.listBusinessRules("missing")).toEqual([]);
  });
});
