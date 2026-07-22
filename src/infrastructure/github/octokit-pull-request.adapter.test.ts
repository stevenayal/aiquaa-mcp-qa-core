import { describe, expect, it, vi } from "vitest";
import type { Octokit } from "@octokit/rest";
import { RepositoryPermissionError } from "../../errors/index.js";
import { OctokitPullRequestAdapter } from "./octokit-pull-request.adapter.js";

const repository = { owner: "aiquaa", repo: "demo" };

function makeFakeOctokit(overrides: Record<string, unknown> = {}) {
  return {
    rest: {
      repos: {
        get: vi.fn().mockResolvedValue({ data: { permissions: { push: true } } }),
      },
      git: {
        getRef: vi.fn().mockResolvedValue({ data: { object: { sha: "base-sha" } } }),
        createRef: vi.fn().mockResolvedValue({}),
        getCommit: vi.fn().mockResolvedValue({ data: { tree: { sha: "tree-sha" } } }),
        createBlob: vi.fn().mockResolvedValue({ data: { sha: "blob-sha" } }),
        createTree: vi.fn().mockResolvedValue({ data: { sha: "new-tree-sha" } }),
        createCommit: vi.fn().mockResolvedValue({ data: { sha: "commit-sha" } }),
        updateRef: vi.fn().mockResolvedValue({}),
      },
      pulls: {
        create: vi.fn().mockResolvedValue({ data: { number: 7, html_url: "https://github.com/pr/7" } }),
        get: vi.fn().mockResolvedValue({
          data: {
            number: 7,
            html_url: "https://github.com/pr/7",
            state: "open",
            merged: false,
            title: "Add scenario",
            head: { ref: "feat/x" },
            base: { ref: "main" },
          },
        }),
      },
      ...overrides,
    },
  } as unknown as Octokit;
}

describe("OctokitPullRequestAdapter", () => {
  it("verifyPermissions reflects push access", async () => {
    const adapter = new OctokitPullRequestAdapter({ octokit: makeFakeOctokit() });
    const permissions = await adapter.verifyPermissions(repository);
    expect(permissions).toEqual({ canRead: true, canWrite: true, canCreatePullRequest: true });
  });

  it("verifyPermissions wraps failures as RepositoryPermissionError", async () => {
    const octokit = makeFakeOctokit({
      repos: { get: vi.fn().mockRejectedValue(new Error("404")) },
    });
    const adapter = new OctokitPullRequestAdapter({ octokit });
    await expect(adapter.verifyPermissions(repository)).rejects.toBeInstanceOf(RepositoryPermissionError);
  });

  it("createBranch creates a ref from the base branch sha when missing", async () => {
    const octokit = makeFakeOctokit();
    (octokit.rest.git.getRef as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: { object: { sha: "base-sha" } } })
      .mockRejectedValueOnce(new Error("not found"));
    const adapter = new OctokitPullRequestAdapter({ octokit });
    const result = await adapter.createBranch({ repository, baseBranch: "main", branchName: "feat/x" });
    expect(result.created).toBe(true);
    expect(octokit.rest.git.createRef).toHaveBeenCalled();
  });

  it("commitChanges builds a single commit via the git data API", async () => {
    const octokit = makeFakeOctokit();
    const adapter = new OctokitPullRequestAdapter({ octokit });
    const result = await adapter.commitChanges({
      repository,
      branchName: "feat/x",
      message: "add scenario",
      files: [{ path: "a.spec.ts", content: "test content" }, { path: "old.ts", content: undefined }],
    });
    expect(result.commitSha).toBe("commit-sha");
    expect(result.modifiedFiles).toEqual(["a.spec.ts"]);
    expect(result.deletedFiles).toEqual(["old.ts"]);
    expect(octokit.rest.git.updateRef).toHaveBeenCalled();
  });

  it("createPullRequest defaults draft to true", async () => {
    const octokit = makeFakeOctokit();
    const adapter = new OctokitPullRequestAdapter({ octokit });
    const result = await adapter.createPullRequest({
      repository,
      baseBranch: "main",
      headBranch: "feat/x",
      title: "Add scenario",
      body: "body",
    });
    expect(result.number).toBe(7);
    expect((octokit.rest.pulls.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0]).toMatchObject({
      draft: true,
    });
  });

  it("getPullRequest maps merged/closed/open state", async () => {
    const octokit = makeFakeOctokit();
    const adapter = new OctokitPullRequestAdapter({ octokit });
    const details = await adapter.getPullRequest({ repository, number: 7 });
    expect(details.state).toBe("open");
    expect(details.headBranch).toBe("feat/x");
  });
});
