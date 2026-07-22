import { describe, expect, it } from "vitest";
import { FileNotFoundError } from "../errors/index.js";
import { InMemoryRepositoryAdapter } from "./in-memory-repository.adapter.js";

describe("InMemoryRepositoryAdapter", () => {
  it("returns metadata with sensible defaults", async () => {
    const repo = new InMemoryRepositoryAdapter();
    const metadata = await repo.getMetadata();
    expect(metadata.defaultBranch).toBe("main");
    expect(await repo.getDefaultBranch()).toBe("main");
  });

  it("reads seeded files and rejects unknown paths", async () => {
    const repo = new InMemoryRepositoryAdapter({ files: { "a.ts": "content" } });
    expect(await repo.readFile("a.ts")).toEqual({ path: "a.ts", content: "content", encoding: "utf8" });
    await expect(repo.readFile("missing.ts")).rejects.toBeInstanceOf(FileNotFoundError);
  });

  it("search finds matching lines and respects pathPrefix/limit", async () => {
    const repo = new InMemoryRepositoryAdapter({ files: { "src/a.ts": "const TODO = 1;\nconst x = 2;" } });
    const results = await repo.search({ query: "TODO", pathPrefix: "src" });
    expect(results).toEqual([{ path: "src/a.ts", lineNumber: 1, snippet: "const TODO = 1;" }]);
    expect(await repo.search({ query: "nomatch" })).toEqual([]);
  });

  it("getTree lists all files", async () => {
    const repo = new InMemoryRepositoryAdapter({ files: { "a.ts": "1", "b.ts": "2" } });
    const tree = await repo.getTree();
    expect(tree.files).toHaveLength(2);
  });
});
