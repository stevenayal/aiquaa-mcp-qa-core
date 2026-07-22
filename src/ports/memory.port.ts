export interface MemoryEntry {
  projectKey: string;
  topicKey: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemorySearchInput {
  projectKey: string;
  query: string;
  limit?: number;
}

export interface MemorySaveInput {
  projectKey: string;
  topicKey: string;
  content: string;
  type?: string;
}

export interface ProjectMemoryPort {
  search(input: MemorySearchInput): Promise<MemoryEntry[]>;
  save(input: MemorySaveInput): Promise<MemoryEntry>;
}
