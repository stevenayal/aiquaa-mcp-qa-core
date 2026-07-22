import { describe, expect, it } from "vitest";
import { generateUnifiedDiff, applyUnifiedDiff, buildUnifiedDiffBody } from "./unified-diff.js";

describe("unified diff generation and application", () => {
  it("returns an empty body when there is no change", () => {
    expect(buildUnifiedDiffBody("same\n", "same\n")).toBe("");
  });

  it("generates headers for a create", () => {
    const diff = generateUnifiedDiff("new.ts", undefined, "export const x = 1;\n");
    expect(diff).toContain("--- /dev/null");
    expect(diff).toContain("+++ b/new.ts");
    expect(diff).toContain("+export const x = 1;");
  });

  it("generates headers for a delete", () => {
    const diff = generateUnifiedDiff("old.ts", "export const x = 1;\n", undefined);
    expect(diff).toContain("+++ /dev/null");
    expect(diff).toContain("-export const x = 1;");
  });

  it("round-trips a simple single-line change", () => {
    const before = "line1\nline2\nline3\n";
    const after = "line1\nCHANGED\nline3\n";
    const diff = generateUnifiedDiff("f.txt", before, after);
    expect(applyUnifiedDiff(before, diff)).toBe(after);
  });

  it("round-trips an addition at the end of the file", () => {
    const before = "line1\nline2\n";
    const after = "line1\nline2\nline3\n";
    const diff = generateUnifiedDiff("f.txt", before, after);
    expect(applyUnifiedDiff(before, diff)).toBe(after);
  });

  it("round-trips a deletion in the middle of a larger file", () => {
    const before = Array.from({ length: 10 }, (_, i) => `line${i}`).join("\n") + "\n";
    const after = Array.from({ length: 10 }, (_, i) => `line${i}`)
      .filter((_, i) => i !== 5)
      .join("\n") + "\n";
    const diff = generateUnifiedDiff("f.txt", before, after);
    expect(applyUnifiedDiff(before, diff)).toBe(after);
  });

  it("preserves unrelated content far from the change (context clustering)", () => {
    const lines = Array.from({ length: 30 }, (_, i) => `l${i}`);
    const before = lines.join("\n") + "\n";
    const changed = [...lines];
    changed[2] = "CHANGED-A";
    changed[27] = "CHANGED-B";
    const after = changed.join("\n") + "\n";
    const diff = generateUnifiedDiff("f.txt", before, after);
    // two separate hunks expected since changes are far apart
    expect(diff.match(/^@@/gm)?.length).toBe(2);
    expect(applyUnifiedDiff(before, diff)).toBe(after);
  });
});
