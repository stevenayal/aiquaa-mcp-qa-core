import { FileNotFoundError } from "../errors/index.js";
import type {
  RepositoryFile,
  RepositoryFileContent,
  RepositoryMetadata,
  RepositoryPort,
  RepositorySearchQuery,
  RepositorySearchResult,
  RepositoryTree,
} from "../ports/repository.port.js";

export interface InMemoryRepositoryAdapterOptions {
  name?: string;
  owner?: string;
  defaultBranch?: string;
  files?: Record<string, string>;
}

/** In-memory RepositoryPort for unit tests — no git/network access. */
export class InMemoryRepositoryAdapter implements RepositoryPort {
  private readonly metadata: RepositoryMetadata;
  private readonly files: Map<string, string>;

  constructor(options: InMemoryRepositoryAdapterOptions = {}) {
    this.metadata = {
      name: options.name ?? "in-memory-repo",
      ...(options.owner ? { owner: options.owner } : {}),
      defaultBranch: options.defaultBranch ?? "main",
    };
    this.files = new Map(Object.entries(options.files ?? {}));
  }

  async getMetadata(): Promise<RepositoryMetadata> {
    return this.metadata;
  }

  async getDefaultBranch(): Promise<string> {
    return this.metadata.defaultBranch;
  }

  async listFiles(): Promise<RepositoryFile[]> {
    return [...this.files.keys()].map((path) => ({ path, type: "file" as const }));
  }

  async readFile(path: string): Promise<RepositoryFileContent> {
    const content = this.files.get(path);
    if (content === undefined) throw new FileNotFoundError(`File not found in repository: "${path}".`);
    return { path, content, encoding: "utf8" };
  }

  async search(query: RepositorySearchQuery): Promise<RepositorySearchResult[]> {
    const results: RepositorySearchResult[] = [];
    for (const [path, content] of this.files) {
      if (query.pathPrefix && !path.startsWith(query.pathPrefix)) continue;
      const lines = content.split(/\r?\n/);
      lines.forEach((line, index) => {
        if (line.includes(query.query)) {
          results.push({ path, lineNumber: index + 1, snippet: line.trim() });
        }
      });
    }
    return query.limit ? results.slice(0, query.limit) : results;
  }

  async getTree(): Promise<RepositoryTree> {
    return { ref: this.metadata.defaultBranch, files: await this.listFiles() };
  }
}
