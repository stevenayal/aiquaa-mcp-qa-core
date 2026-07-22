import { FileNotFoundError } from "../errors/index.js";
import type { FileSystemPort } from "../ports/filesystem.port.js";

/** In-memory FileSystemPort for unit tests — no disk access. */
export class InMemoryFileSystemAdapter implements FileSystemPort {
  private readonly files = new Map<string, string>();
  private readonly directories = new Set<string>();

  constructor(initialFiles: Record<string, string> = {}) {
    for (const [path, content] of Object.entries(initialFiles)) {
      this.files.set(path, content);
    }
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) throw new FileNotFoundError(`File not found: "${path}".`);
    return content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.directories.has(path);
  }

  async listFiles(path: string): Promise<string[]> {
    const prefix = path.endsWith("/") ? path : `${path}/`;
    return [...this.files.keys()].filter((file) => file.startsWith(prefix));
  }

  async createDirectory(path: string): Promise<void> {
    this.directories.add(path);
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.files.has(path)) throw new FileNotFoundError(`Cannot delete missing file: "${path}".`);
    this.files.delete(path);
  }

  snapshot(): Record<string, string> {
    return Object.fromEntries(this.files);
  }
}
