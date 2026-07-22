import path from "node:path";
import { describe, expect, it } from "vitest";
import { UnsafePathError } from "../errors/index.js";
import { PathPolicy } from "./path-policy.js";

describe("PathPolicy", () => {
  const root = path.resolve("workspace");
  const policy = new PathPolicy({ allowedRoots: [root] });

  it("accepts a relative path within the root", () => {
    expect(() => policy.assertSafe("src/index.ts")).not.toThrow();
  });

  it("rejects path traversal", () => {
    expect(() => policy.assertSafe("../secrets.env")).toThrow(UnsafePathError);
  });

  it("rejects .git and node_modules segments", () => {
    expect(() => policy.assertSafe(".git/config")).toThrow(UnsafePathError);
    expect(() => policy.assertSafe("node_modules/pkg/index.js")).toThrow(UnsafePathError);
  });

  it("rejects absolute paths outside allowed roots", () => {
    expect(() => policy.assertSafe(path.resolve("other-workspace/file.ts"))).toThrow(UnsafePathError);
  });

  it("isSafe returns a boolean instead of throwing", () => {
    expect(policy.isSafe("src/index.ts")).toBe(true);
    expect(policy.isSafe("../outside.ts")).toBe(false);
  });

  it("requires at least one allowed root", () => {
    expect(() => new PathPolicy({ allowedRoots: [] })).toThrow(UnsafePathError);
  });
});
