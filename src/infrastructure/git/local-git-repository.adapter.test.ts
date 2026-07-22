import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LocalGitRepositoryAdapter } from "./local-git-repository.adapter.js";

function git(args: string[], cwd: string): void {
  execFileSync("git", args, { cwd, stdio: "pipe" });
}

describe("LocalGitRepositoryAdapter", () => {
  let dir: string;
  let adapter: LocalGitRepositoryAdapter;

  beforeAll(() => {
    dir = mkdtempSync(path.join(os.tmpdir(), "qa-core-git-"));
    git(["init", "-b", "main"], dir);
    git(["config", "user.email", "test@example.com"], dir);
    git(["config", "user.name", "Test"], dir);
    writeFileSync(path.join(dir, "a.txt"), "hello world\nTODO fix this\n");
    git(["add", "."], dir);
    git(["commit", "-m", "initial commit"], dir);
    adapter = new LocalGitRepositoryAdapter({ workingDirectory: dir });
  });

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("resolves the default branch from HEAD", async () => {
    expect(await adapter.getDefaultBranch()).toBe("main");
  });

  it("lists committed files", async () => {
    const files = await adapter.listFiles();
    expect(files).toEqual([{ path: "a.txt", type: "file" }]);
  });

  it("reads file content at HEAD", async () => {
    const content = await adapter.readFile("a.txt");
    expect(content.content).toContain("hello world");
  });

  it("searches for a term across the tree", async () => {
    const results = await adapter.search({ query: "TODO" });
    expect(results).toEqual([{ path: "a.txt", lineNumber: 2, snippet: "TODO fix this" }]);
  });

  it("returns metadata including the repository name", async () => {
    const metadata = await adapter.getMetadata();
    expect(metadata.name).toBe(path.basename(dir));
    expect(metadata.defaultBranch).toBe("main");
  });

  it("getTree returns the same files as listFiles", async () => {
    const tree = await adapter.getTree();
    expect(tree.files).toEqual(await adapter.listFiles());
  });
});
