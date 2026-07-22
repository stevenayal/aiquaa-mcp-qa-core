import { describe, expect, it } from "vitest";
import { InMemoryPullRequestAdapter } from "../../testing/in-memory-pull-request.adapter.js";
import { OperationBlockedError } from "../../errors/index.js";
import { runPullRequestFlow } from "./pull-request-flow.js";

const repository = { owner: "aiquaa", repo: "demo" };

describe("runPullRequestFlow", () => {
  it("defaults to dryRun and does not touch the port's write methods", async () => {
    const port = new InMemoryPullRequestAdapter();
    const result = await runPullRequestFlow(port, {
      repository,
      baseBranch: "main",
      branchName: "feat/x",
      commitMessage: "add scenario",
      title: "Add scenario",
      body: "body",
      files: [{ path: "a.spec.ts", operation: "create", nextContent: "x", reason: "new" }],
    });
    expect(result.dryRun).toBe(true);
    expect(result.createdFiles).toEqual(["a.spec.ts"]);
    expect(port.commits).toHaveLength(0);
  });

  it("creates a branch, commits and opens a draft PR when dryRun=false", async () => {
    const port = new InMemoryPullRequestAdapter();
    const result = await runPullRequestFlow(port, {
      repository,
      baseBranch: "main",
      branchName: "feat/x",
      commitMessage: "add scenario",
      title: "Add scenario",
      body: "body",
      files: [{ path: "a.spec.ts", operation: "create", nextContent: "x", reason: "new" }],
      dryRun: false,
    });
    expect(result.dryRun).toBe(false);
    expect(result.pullRequestNumber).toBe(1);
    expect(port.commits).toHaveLength(1);
  });

  it("throws OperationBlockedError when the port reports no write permission", async () => {
    const port = new InMemoryPullRequestAdapter({ permissions: { canRead: true, canWrite: false, canCreatePullRequest: false } });
    await expect(
      runPullRequestFlow(port, {
        repository,
        baseBranch: "main",
        branchName: "feat/x",
        commitMessage: "m",
        title: "t",
        body: "b",
        files: [],
        dryRun: false,
      }),
    ).rejects.toBeInstanceOf(OperationBlockedError);
  });
});
