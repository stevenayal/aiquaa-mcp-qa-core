import { describe, expect, it, vi } from "vitest";
import type { Octokit } from "@octokit/rest";
import { FileNotFoundError, RepositoryNotFoundError } from "../../errors/index.js";
import { GitHubRepositoryAdapter } from "./github-repository.adapter.js";

function makeFakeOctokit(overrides: Record<string, unknown> = {}) {
  return {
    rest: {
      repos: {
        get: vi.fn().mockResolvedValue({
          data: { name: "demo", owner: { login: "aiquaa" }, default_branch: "main", html_url: "https://github.com/aiquaa/demo" },
        }),
        getContent: vi.fn().mockResolvedValue({
          data: { type: "file", content: Buffer.from("hello").toString("base64"), encoding: "base64", sha: "sha1" },
        }),
      },
      git: {
        getTree: vi.fn().mockResolvedValue({
          data: { tree: [{ path: "a.ts", type: "blob", size: 10 }, { path: "src", type: "tree" }] },
        }),
      },
      search: {
        code: vi.fn().mockResolvedValue({ data: { items: [{ path: "a.ts", name: "a.ts" }] } }),
      },
      ...overrides,
    },
  } as unknown as Octokit;
}

describe("GitHubRepositoryAdapter", () => {
  it("returns metadata", async () => {
    const adapter = new GitHubRepositoryAdapter({ octokit: makeFakeOctokit(), owner: "aiquaa", repo: "demo" });
    const metadata = await adapter.getMetadata();
    expect(metadata).toEqual({ name: "demo", owner: "aiquaa", defaultBranch: "main", url: "https://github.com/aiquaa/demo" });
  });

  it("wraps a missing repository as RepositoryNotFoundError", async () => {
    const octokit = makeFakeOctokit({ repos: { get: vi.fn().mockRejectedValue(new Error("404")) } });
    const adapter = new GitHubRepositoryAdapter({ octokit, owner: "aiquaa", repo: "missing" });
    await expect(adapter.getMetadata()).rejects.toBeInstanceOf(RepositoryNotFoundError);
  });

  it("reads and decodes base64 file content", async () => {
    const adapter = new GitHubRepositoryAdapter({ octokit: makeFakeOctokit(), owner: "aiquaa", repo: "demo" });
    const file = await adapter.readFile("a.ts");
    expect(file.content).toBe("hello");
  });

  it("throws FileNotFoundError for a directory path", async () => {
    const octokit = makeFakeOctokit({
      repos: {
        get: vi.fn(),
        getContent: vi.fn().mockResolvedValue({ data: [{ type: "dir" }] }),
      },
    });
    const adapter = new GitHubRepositoryAdapter({ octokit, owner: "aiquaa", repo: "demo" });
    await expect(adapter.readFile("src")).rejects.toBeInstanceOf(FileNotFoundError);
  });

  it("getTree maps blob/tree entries to file/directory types", async () => {
    const adapter = new GitHubRepositoryAdapter({ octokit: makeFakeOctokit(), owner: "aiquaa", repo: "demo" });
    const tree = await adapter.getTree("main");
    expect(tree.files).toEqual([
      { path: "a.ts", type: "file", size: 10 },
      { path: "src", type: "directory" },
    ]);
  });

  it("search returns code search results", async () => {
    const adapter = new GitHubRepositoryAdapter({ octokit: makeFakeOctokit(), owner: "aiquaa", repo: "demo" });
    const results = await adapter.search({ query: "TODO" });
    expect(results).toEqual([{ path: "a.ts", snippet: "a.ts" }]);
  });
});
