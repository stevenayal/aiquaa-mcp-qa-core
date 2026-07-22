import { describe, expect, it } from "vitest";
import { MemoryError } from "../../errors/index.js";
import { EngramCliAdapter } from "./engram-cli.adapter.js";

describe("EngramCliAdapter", () => {
  it("prefixes the project name and returns parsed search results", async () => {
    const calls: unknown[] = [];
    const runner = async (request: unknown) => {
      calls.push(request);
      return "some memory content";
    };
    const adapter = new EngramCliAdapter({ runner, projectPrefix: "aiquaa-" });
    const results = await adapter.search({ projectKey: "demo", query: "auth" });
    expect(results[0]?.projectKey).toBe("aiquaa-demo");
    expect(results[0]?.content).toBe("some memory content");
    expect((calls[0] as { args: string[] }).args).toContain("aiquaa-demo");
  });

  it("redacts content before saving", async () => {
    const runner = async () => "ok";
    const adapter = new EngramCliAdapter({ runner });
    const entry = await adapter.save({ projectKey: "demo", topicKey: "auth", content: "AKIAABCDEFGHIJKLMNOP" });
    expect(entry.content).not.toContain("AKIAABCDEFGHIJKLMNOP");
  });

  it("wraps runner failures as MemoryError", async () => {
    const runner = async () => {
      throw new Error("engram not found");
    };
    const adapter = new EngramCliAdapter({ runner });
    await expect(adapter.search({ projectKey: "demo", query: "x" })).rejects.toBeInstanceOf(MemoryError);
    await expect(adapter.save({ projectKey: "demo", topicKey: "t", content: "x" })).rejects.toBeInstanceOf(
      MemoryError,
    );
  });
});
