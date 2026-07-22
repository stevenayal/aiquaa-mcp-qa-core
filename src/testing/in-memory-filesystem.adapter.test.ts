import { describe, expect, it } from "vitest";
import { FileNotFoundError } from "../errors/index.js";
import { InMemoryFileSystemAdapter } from "./in-memory-filesystem.adapter.js";

describe("InMemoryFileSystemAdapter", () => {
  it("reads seeded files", async () => {
    const fs = new InMemoryFileSystemAdapter({ "a.txt": "hello" });
    expect(await fs.readFile("a.txt")).toBe("hello");
  });

  it("throws FileNotFoundError for a missing file", async () => {
    const fs = new InMemoryFileSystemAdapter();
    await expect(fs.readFile("missing.txt")).rejects.toBeInstanceOf(FileNotFoundError);
  });

  it("writes and overwrites files", async () => {
    const fs = new InMemoryFileSystemAdapter();
    await fs.writeFile("a.txt", "v1");
    await fs.writeFile("a.txt", "v2");
    expect(await fs.readFile("a.txt")).toBe("v2");
  });

  it("exists reflects files and directories", async () => {
    const fs = new InMemoryFileSystemAdapter({ "a.txt": "x" });
    expect(await fs.exists("a.txt")).toBe(true);
    expect(await fs.exists("missing.txt")).toBe(false);
    await fs.createDirectory("dir");
    expect(await fs.exists("dir")).toBe(true);
  });

  it("listFiles filters by prefix", async () => {
    const fs = new InMemoryFileSystemAdapter({ "dir/a.txt": "1", "dir/b.txt": "2", "other/c.txt": "3" });
    expect((await fs.listFiles("dir")).sort()).toEqual(["dir/a.txt", "dir/b.txt"]);
  });

  it("deleteFile removes an existing file and rejects a missing one", async () => {
    const fs = new InMemoryFileSystemAdapter({ "a.txt": "x" });
    await fs.deleteFile("a.txt");
    expect(await fs.exists("a.txt")).toBe(false);
    await expect(fs.deleteFile("a.txt")).rejects.toBeInstanceOf(FileNotFoundError);
  });

  it("snapshot returns the current file map", async () => {
    const fs = new InMemoryFileSystemAdapter({ "a.txt": "x" });
    expect(fs.snapshot()).toEqual({ "a.txt": "x" });
  });
});
