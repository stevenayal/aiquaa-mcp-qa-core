import { describe, expect, it } from "vitest";
import { PatchGenerator } from "./patch-generator.js";

describe("PatchGenerator", () => {
  const generator = new PatchGenerator();

  it("returns undefined for a keep operation", () => {
    expect(generator.generate({ path: "a.ts", operation: "keep", reason: "no change" })).toBeUndefined();
  });

  it("produces a FilePatch for a create", () => {
    const patch = generator.generate({
      path: "a.ts",
      operation: "create",
      nextContent: "export {};\n",
      reason: "new file",
    });
    expect(patch?.operation).toBe("create");
    expect(patch?.unifiedDiff).toContain("+export {};");
  });

  it("generateAll filters out keep operations", () => {
    const patches = generator.generateAll([
      { path: "a.ts", operation: "keep", reason: "no change" },
      { path: "b.ts", operation: "create", nextContent: "x", reason: "new" },
    ]);
    expect(patches).toHaveLength(1);
    expect(patches[0]?.path).toBe("b.ts");
  });
});
