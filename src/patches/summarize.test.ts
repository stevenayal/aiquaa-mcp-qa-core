import { describe, expect, it } from "vitest";
import { summarizePatch, detectUnexpectedDeletions, detectOutOfScopeChanges } from "./summarize.js";
import type { FileChange } from "./types.js";

const changes: FileChange[] = [
  { path: "a.ts", operation: "create", reason: "r" },
  { path: "b.ts", operation: "update", reason: "r" },
  { path: "c.ts", operation: "delete", reason: "r" },
  { path: "d.ts", operation: "keep", reason: "r" },
];

describe("summarizePatch", () => {
  it("buckets changes by operation", () => {
    expect(summarizePatch(changes)).toEqual({
      created: ["a.ts"],
      updated: ["b.ts"],
      deleted: ["c.ts"],
      kept: ["d.ts"],
    });
  });
});

describe("detectUnexpectedDeletions", () => {
  it("flags deletions not explicitly expected", () => {
    expect(detectUnexpectedDeletions(changes, [])).toHaveLength(1);
    expect(detectUnexpectedDeletions(changes, ["c.ts"])).toHaveLength(0);
  });
});

describe("detectOutOfScopeChanges", () => {
  it("flags paths outside the given scope prefixes", () => {
    const out = detectOutOfScopeChanges(changes, ["a.ts", "b.ts"]);
    expect(out.map((c) => c.path)).toEqual(["c.ts", "d.ts"]);
  });

  it("returns nothing when scope is empty (unrestricted)", () => {
    expect(detectOutOfScopeChanges(changes, [])).toEqual([]);
  });
});
