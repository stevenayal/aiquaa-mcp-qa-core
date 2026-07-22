import { redact } from "../../security/redaction.js";
import type { MemoryEntry, MemorySaveInput, MemorySearchInput, ProjectMemoryPort } from "../../ports/memory.port.js";

/** In-memory ProjectMemoryPort for tests and offline development. */
export class InMemoryProjectMemoryAdapter implements ProjectMemoryPort {
  private readonly entries = new Map<string, MemoryEntry>();

  async search(input: MemorySearchInput): Promise<MemoryEntry[]> {
    const query = input.query.toLowerCase();
    const results = [...this.entries.values()].filter(
      (entry) => entry.projectKey === input.projectKey && entry.content.toLowerCase().includes(query),
    );
    return input.limit ? results.slice(0, input.limit) : results;
  }

  async save(input: MemorySaveInput): Promise<MemoryEntry> {
    const key = `${input.projectKey}:${input.topicKey}`;
    const now = new Date().toISOString();
    const existing = this.entries.get(key);
    const entry: MemoryEntry = {
      projectKey: input.projectKey,
      topicKey: input.topicKey,
      content: redact(input.content),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.entries.set(key, entry);
    return entry;
  }
}
