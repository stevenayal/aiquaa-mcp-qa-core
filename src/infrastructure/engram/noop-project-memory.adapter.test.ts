import { describe, expect, it } from "vitest";
import { NoopProjectMemoryAdapter } from "./noop-project-memory.adapter.js";

describe("NoopProjectMemoryAdapter", () => {
  it("search always returns an empty array", async () => {
    const memory = new NoopProjectMemoryAdapter();
    expect(await memory.search({ projectKey: "p", query: "x" })).toEqual([]);
  });

  it("save returns an entry without persisting anything", async () => {
    const memory = new NoopProjectMemoryAdapter();
    const entry = await memory.save({ projectKey: "p", topicKey: "t", content: "x" });
    expect(entry.projectKey).toBe("p");
    expect(await memory.search({ projectKey: "p", query: "x" })).toEqual([]);
  });
});
