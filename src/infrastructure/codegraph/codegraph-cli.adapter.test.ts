import path from "node:path";
import { describe, expect, it } from "vitest";
import { UnsafePathError, CodeGraphError } from "../../errors/index.js";
import { CodeGraphCliAdapter } from "./codegraph-cli.adapter.js";

describe("CodeGraphCliAdapter", () => {
  const allowedRoots = [path.resolve("workspace")];

  it("rejects a project path outside allowedRoots before running any command", async () => {
    const runner = async () => "";
    const adapter = new CodeGraphCliAdapter({ allowedRoots, runner });
    await expect(
      adapter.analyzeRepository({ projectPath: path.resolve("elsewhere"), task: "find X" }),
    ).rejects.toBeInstanceOf(UnsafePathError);
  });

  it("parses valid JSON output from the CLI", async () => {
    const runner = async () =>
      JSON.stringify({ files: [{ path: "a.ts" }], symbols: [], relationships: [], warnings: [] });
    const adapter = new CodeGraphCliAdapter({ allowedRoots, runner });
    const result = await adapter.analyzeRepository({ projectPath: allowedRoots[0]!, task: "find X" });
    expect(result.files).toEqual([{ path: "a.ts" }]);
  });

  it("returns a warning instead of throwing when output is not valid JSON", async () => {
    const runner = async () => "not json";
    const adapter = new CodeGraphCliAdapter({ allowedRoots, runner });
    const result = await adapter.analyzeRepository({ projectPath: allowedRoots[0]!, task: "find X" });
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("wraps a runner failure as CodeGraphError", async () => {
    const runner = async () => {
      throw new Error("binary not found");
    };
    const adapter = new CodeGraphCliAdapter({ allowedRoots, runner });
    await expect(adapter.analyzeRepository({ projectPath: allowedRoots[0]!, task: "find X" })).rejects.toBeInstanceOf(
      CodeGraphError,
    );
  });
});
