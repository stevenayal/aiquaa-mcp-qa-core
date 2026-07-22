import { describe, expect, it } from "vitest";
import { PatchGenerationError } from "../errors/index.js";
import { PatchGenerator } from "./patch-generator.js";
import { PatchApplier } from "./patch-applier.js";

describe("PatchApplier", () => {
  it("applies a create patch against empty original content", async () => {
    const generator = new PatchGenerator();
    const applier = new PatchApplier();
    const patch = generator.generate({ path: "a.ts", operation: "create", nextContent: "export {};\n", reason: "new" });
    const result = await applier.applyToContent("", patch!);
    expect(result).toBe("export {};\n");
  });

  it("applies an update patch against the real original content", async () => {
    const generator = new PatchGenerator();
    const applier = new PatchApplier();
    const before = "a\nb\nc\n";
    const after = "a\nB\nc\n";
    const patch = generator.generate({ path: "a.ts", operation: "update", previousContent: before, nextContent: after, reason: "x" });
    const result = await applier.applyToContent(before, patch!);
    expect(result).toBe(after);
  });

  it("apply() reads/writes through the provided callbacks", async () => {
    const generator = new PatchGenerator();
    const applier = new PatchApplier();
    const before = "a\nb\n";
    const after = "a\nB\n";
    const patch = generator.generate({ path: "a.ts", operation: "update", previousContent: before, nextContent: after, reason: "x" })!;

    const files = new Map<string, string>([["a.ts", before]]);
    await applier.apply(
      patch,
      async (p) => files.get(p),
      async (p, content) => {
        if (content === undefined) files.delete(p);
        else files.set(p, content);
      },
    );
    expect(files.get("a.ts")).toBe(after);
  });

  it("applyToContent rejects a delete patch", async () => {
    const applier = new PatchApplier();
    await expect(applier.applyToContent("x", { path: "a.ts", operation: "delete", unifiedDiff: "" })).rejects.toBeInstanceOf(
      PatchGenerationError,
    );
  });

  it("applyToContent rejects a create patch against non-empty original content", async () => {
    const applier = new PatchApplier();
    await expect(
      applier.applyToContent("already here", { path: "a.ts", operation: "create", unifiedDiff: "" }),
    ).rejects.toBeInstanceOf(PatchGenerationError);
  });

  it("applyAll applies every patch through read/write callbacks", async () => {
    const generator = new PatchGenerator();
    const applier = new PatchApplier();
    const files = new Map<string, string>([["a.ts", "a\nb\n"]]);
    const patchA = generator.generate({ path: "a.ts", operation: "update", previousContent: "a\nb\n", nextContent: "a\nB\n", reason: "x" })!;
    const patchB = generator.generate({ path: "new.ts", operation: "create", nextContent: "new\n", reason: "x" })!;
    await applier.applyAll(
      [patchA, patchB],
      async (p) => files.get(p),
      async (p, content) => {
        if (content === undefined) files.delete(p);
        else files.set(p, content);
      },
    );
    expect(files.get("a.ts")).toBe("a\nB\n");
    expect(files.get("new.ts")).toBe("new\n");
  });

  it("apply() deletes the file for a delete patch", async () => {
    const applier = new PatchApplier();
    const files = new Map<string, string>([["a.ts", "content"]]);
    await applier.apply(
      { path: "a.ts", operation: "delete", unifiedDiff: "" },
      async (p) => files.get(p),
      async (p, content) => {
        if (content === undefined) files.delete(p);
      },
    );
    expect(files.has("a.ts")).toBe(false);
  });
});
