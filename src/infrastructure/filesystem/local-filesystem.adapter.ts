import { readFile, writeFile, access, readdir, mkdir, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { FileNotFoundError, UnsafePathError } from "../../errors/index.js";
import { PathPolicy } from "../../security/path-policy.js";
import type { FileSystemPort } from "../../ports/filesystem.port.js";

export interface LocalFileSystemAdapterOptions {
  allowedRoots: string[];
}

/** FileSystemPort backed by node:fs, gated by PathPolicy so every call stays inside allowedRoots. */
export class LocalFileSystemAdapter implements FileSystemPort {
  private readonly pathPolicy: PathPolicy;

  constructor(options: LocalFileSystemAdapterOptions) {
    this.pathPolicy = new PathPolicy({ allowedRoots: options.allowedRoots });
  }

  async readFile(filePath: string): Promise<string> {
    const resolved = this.pathPolicy.assertSafe(filePath);
    try {
      return await readFile(resolved, "utf8");
    } catch (error) {
      throw new FileNotFoundError(`File not found: "${filePath}".`, { cause: error });
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const resolved = this.pathPolicy.assertSafe(filePath);
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, content, "utf8");
  }

  async exists(filePath: string): Promise<boolean> {
    if (!this.pathPolicy.isSafe(filePath)) return false;
    const resolved = this.pathPolicy.assertSafe(filePath);
    try {
      await access(resolved);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(dirPath: string): Promise<string[]> {
    const resolved = this.pathPolicy.assertSafe(dirPath);
    const entries = await readdir(resolved, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.listFiles(entryPath)));
      } else {
        files.push(entryPath);
      }
    }
    return files;
  }

  async createDirectory(dirPath: string): Promise<void> {
    const resolved = this.pathPolicy.assertSafe(dirPath);
    await mkdir(resolved, { recursive: true });
  }

  async deleteFile(filePath: string): Promise<void> {
    const resolved = this.pathPolicy.assertSafe(filePath);
    const info = await stat(resolved).catch(() => undefined);
    if (!info) {
      throw new FileNotFoundError(`Cannot delete missing file: "${filePath}".`);
    }
    if (!info.isFile()) {
      throw new UnsafePathError(`Refusing to delete non-file path: "${filePath}".`);
    }
    await unlink(resolved);
  }
}
