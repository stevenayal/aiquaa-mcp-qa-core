import path from "node:path";
import { runGit } from "./run-git.js";
import type {
  RepositoryFile,
  RepositoryFileContent,
  RepositoryMetadata,
  RepositoryPort,
  RepositorySearchQuery,
  RepositorySearchResult,
  RepositoryTree,
} from "../../ports/repository.port.js";

export interface LocalGitRepositoryAdapterOptions {
  workingDirectory: string;
}

/** RepositoryPort backed by the local `git` CLI against a checked-out worktree. */
export class LocalGitRepositoryAdapter implements RepositoryPort {
  private readonly cwd: string;

  constructor(options: LocalGitRepositoryAdapterOptions) {
    this.cwd = options.workingDirectory;
  }

  async getMetadata(): Promise<RepositoryMetadata> {
    const defaultBranch = await this.getDefaultBranch();
    let url: string | undefined;
    try {
      url = (await runGit(["remote", "get-url", "origin"], { cwd: this.cwd })).trim() || undefined;
    } catch {
      url = undefined;
    }
    return {
      name: path.basename(this.cwd),
      defaultBranch,
      ...(url ? { url } : {}),
    };
  }

  async getDefaultBranch(): Promise<string> {
    try {
      const output = await runGit(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], { cwd: this.cwd });
      return output.trim().replace(/^origin\//, "");
    } catch {
      const output = await runGit(["rev-parse", "--abbrev-ref", "HEAD"], { cwd: this.cwd });
      return output.trim();
    }
  }

  async listFiles(ref = "HEAD"): Promise<RepositoryFile[]> {
    const output = await runGit(["ls-tree", "-r", "--name-only", ref], { cwd: this.cwd });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((filePath) => ({ path: filePath, type: "file" as const }));
  }

  async readFile(filePath: string, ref = "HEAD"): Promise<RepositoryFileContent> {
    const content = await runGit(["show", `${ref}:${filePath}`], { cwd: this.cwd });
    return { path: filePath, content, encoding: "utf8" };
  }

  async search(query: RepositorySearchQuery): Promise<RepositorySearchResult[]> {
    const args = ["grep", "-n", "-e", query.query, "HEAD"];
    if (query.pathPrefix) args.push("--", query.pathPrefix);
    let output: string;
    try {
      output = await runGit(args, { cwd: this.cwd });
    } catch {
      return [];
    }
    const results = output
      .split("\n")
      .filter(Boolean)
      .map((line): RepositorySearchResult | undefined => {
        const match = /^HEAD:([^:]+):(\d+):(.*)$/.exec(line);
        if (!match) return undefined;
        return {
          path: match[1]!,
          lineNumber: Number.parseInt(match[2]!, 10),
          snippet: match[3]!,
        };
      })
      .filter((result): result is RepositorySearchResult => result !== undefined);

    return query.limit ? results.slice(0, query.limit) : results;
  }

  async getTree(ref = "HEAD"): Promise<RepositoryTree> {
    const files = await this.listFiles(ref);
    return { ref, files };
  }
}
