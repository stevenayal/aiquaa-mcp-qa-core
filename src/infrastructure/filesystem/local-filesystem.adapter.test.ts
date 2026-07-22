import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileNotFoundError, UnsafePathError } from "../../errors/index.js";
import { LocalFileSystemAdapter } from "./local-filesystem.adapter.js";

describe("LocalFileSystemAdapter", () => {
  let dir: string;
  let fs: LocalFileSystemAdapter;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "qa-core-fs-"));
    fs = new LocalFileSystemAdapter({ allowedRoots: [dir] });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes and reads a file, creating parent directories", async () => {
    await fs.writeFile("nested/dir/file.txt", "hello");
    expect(await fs.readFile("nested/dir/file.txt")).toBe("hello");
  });

  it("exists reflects presence", async () => {
    expect(await fs.exists("missing.txt")).toBe(false);
    await fs.writeFile("present.txt", "x");
    expect(await fs.exists("present.txt")).toBe(true);
  });

  it("throws FileNotFoundError when reading a missing file", async () => {
    await expect(fs.readFile("missing.txt")).rejects.toBeInstanceOf(FileNotFoundError);
  });

  it("lists files recursively", async () => {
    await fs.writeFile("a.txt", "1");
    await fs.writeFile("sub/b.txt", "2");
    const files = (await fs.listFiles(".")).map((f) => f.replace(/\\/g, "/")).sort();
    expect(files).toEqual(["a.txt", "sub/b.txt"]);
  });

  it("deletes a file", async () => {
    await fs.writeFile("a.txt", "1");
    await fs.deleteFile("a.txt");
    expect(await fs.exists("a.txt")).toBe(false);
  });

  it("rejects paths outside the allowed root", async () => {
    await expect(fs.readFile("../outside.txt")).rejects.toBeInstanceOf(UnsafePathError);
  });
});
