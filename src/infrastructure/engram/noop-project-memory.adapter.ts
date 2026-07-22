import type { MemoryEntry, MemorySaveInput, MemorySearchInput, ProjectMemoryPort } from "../../ports/memory.port.js";

export class NoopProjectMemoryAdapter implements ProjectMemoryPort {
  async search(_input: MemorySearchInput): Promise<MemoryEntry[]> {
    return [];
  }

  async save(input: MemorySaveInput): Promise<MemoryEntry> {
    const now = new Date().toISOString();
    return { projectKey: input.projectKey, topicKey: input.topicKey, content: "", createdAt: now, updatedAt: now };
  }
}
