import path from "node:path";
import { describe, expect, it } from "vitest";
import { UnsafePathError } from "../../errors/index.js";
import { parseAllowedRoots, resolveAllowedProjectPath } from "./allowed-roots.js";

describe("parseAllowedRoots", () => {
  it("splits and resolves a delimiter-separated list", () => {
    const roots = parseAllowedRoots(["a", "b"].join(path.delimiter));
    expect(roots).toEqual([path.resolve("a"), path.resolve("b")]);
  });

  it("returns an empty array for undefined", () => {
    expect(parseAllowedRoots(undefined)).toEqual([]);
  });
});

describe("resolveAllowedProjectPath", () => {
  it("throws when no roots are configured", () => {
    expect(() => resolveAllowedProjectPath("x", [])).toThrow(UnsafePathError);
  });

  it("resolves a path inside an allowed root", () => {
    const root = path.resolve("workspace");
    expect(resolveAllowedProjectPath(path.join(root, "sub"), [root])).toBe(path.join(root, "sub"));
  });

  it("throws for a path outside every allowed root", () => {
    const root = path.resolve("workspace");
    expect(() => resolveAllowedProjectPath(path.resolve("other"), [root])).toThrow(UnsafePathError);
  });
});
