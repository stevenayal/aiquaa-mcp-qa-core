import { describe, expect, it } from "vitest";
import { InMemoryPullRequestAdapter } from "./in-memory-pull-request.adapter.js";

const repository = { owner: "aiquaa", repo: "demo" };

describe("InMemoryPullRequestAdapter", () => {
  it("reports default full permissions", async () => {
    const adapter = new InMemoryPullRequestAdapter();
    expect(await adapter.verifyPermissions(repository)).toEqual({
      canRead: true,
      canWrite: true,
      canCreatePullRequest: true,
    });
  });

  it("creates a branch once and reports created=false on retry", async () => {
    const adapter = new InMemoryPullRequestAdapter();
    const first = await adapter.createBranch({ repository, baseBranch: "main", branchName: "feat/x" });
    const second = await adapter.createBranch({ repository, baseBranch: "main", branchName: "feat/x" });
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
  });

  it("records commits and pull requests", async () => {
    const adapter = new InMemoryPullRequestAdapter();
    await adapter.commitChanges({
      repository,
      branchName: "feat/x",
      message: "add test",
      files: [{ path: "a.ts", content: "x" }],
    });
    const pr = await adapter.createPullRequest({
      repository,
      baseBranch: "main",
      headBranch: "feat/x",
      title: "Add test",
      body: "body",
    });
    expect(adapter.commits).toHaveLength(1);
    expect(pr.number).toBe(1);
    expect(pr.url).toContain("/pull/1");
  });

  it("getPullRequest returns details for a created PR", async () => {
    const adapter = new InMemoryPullRequestAdapter();
    await adapter.createPullRequest({
      repository,
      baseBranch: "main",
      headBranch: "feat/x",
      title: "Add test",
      body: "body",
    });
    const details = await adapter.getPullRequest({ repository, number: 1 });
    expect(details.title).toBe("Add test");
    expect(details.state).toBe("open");
  });
});
