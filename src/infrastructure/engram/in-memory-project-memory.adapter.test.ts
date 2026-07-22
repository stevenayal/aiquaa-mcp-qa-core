import { describe, expect, it } from "vitest";
import { InMemoryProjectMemoryAdapter } from "./in-memory-project-memory.adapter.js";

describe("InMemoryProjectMemoryAdapter", () => {
  it("saves and searches entries by project and content", async () => {
    const memory = new InMemoryProjectMemoryAdapter();
    await memory.save({ projectKey: "proj-1", topicKey: "auth", content: "Login uses JWT tokens." });
    await memory.save({ projectKey: "proj-1", topicKey: "billing", content: "Billing uses Stripe." });

    const results = await memory.search({ projectKey: "proj-1", query: "jwt" });
    expect(results).toHaveLength(1);
    expect(results[0]?.topicKey).toBe("auth");
  });

  it("redacts secrets before storing content", async () => {
    const memory = new InMemoryProjectMemoryAdapter();
    const entry = await memory.save({ projectKey: "p", topicKey: "t", content: "AKIAABCDEFGHIJKLMNOP" });
    expect(entry.content).not.toContain("AKIAABCDEFGHIJKLMNOP");
  });

  it("is idempotent on topicKey — saving again updates, not duplicates", async () => {
    const memory = new InMemoryProjectMemoryAdapter();
    await memory.save({ projectKey: "p", topicKey: "t", content: "v1" });
    await memory.save({ projectKey: "p", topicKey: "t", content: "v2" });
    const results = await memory.search({ projectKey: "p", query: "v" });
    expect(results).toHaveLength(1);
    expect(results[0]?.content).toBe("v2");
  });
});
