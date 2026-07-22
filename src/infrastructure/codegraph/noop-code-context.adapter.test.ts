import { describe, expect, it } from "vitest";
import { NoopCodeContextAdapter } from "./noop-code-context.adapter.js";

describe("NoopCodeContextAdapter", () => {
  it("returns an empty result with a warning", async () => {
    const adapter = new NoopCodeContextAdapter();
    const result = await adapter.analyzeRepository({ projectPath: ".", task: "find auth code" });
    expect(result.files).toEqual([]);
    expect(result.symbols).toEqual([]);
    expect(result.warnings[0]).toContain("find auth code");
  });
});
