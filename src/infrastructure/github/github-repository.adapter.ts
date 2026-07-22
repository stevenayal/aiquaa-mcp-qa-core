import type { Octokit } from "@octokit/rest";
import { FileNotFoundError, RepositoryNotFoundError } from "../../errors/index.js";
import type {
  RepositoryFile,
  RepositoryFileContent,
  RepositoryMetadata,
  RepositoryPort,
  RepositorySearchQuery,
  RepositorySearchResult,
  RepositoryTree,
} from "../../ports/repository.port.js";

export interface GitHubRepositoryAdapterOptions {
  octokit: Octokit;
  owner: string;
  repo: string;
}

/** RepositoryPort implementation reading a GitHub repository through the REST API (no local checkout needed). */
export class GitHubRepositoryAdapter implements RepositoryPort {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;

  constructor(options: GitHubRepositoryAdapterOptions) {
    this.octokit = options.octokit;
    this.owner = options.owner;
    this.repo = options.repo;
  }

  async getMetadata(): Promise<RepositoryMetadata> {
    try {
      const response = await this.octokit.rest.repos.get({ owner: this.owner, repo: this.repo });
      return {
        name: response.data.name,
        owner: response.data.owner.login,
        defaultBranch: response.data.default_branch,
        url: response.data.html_url,
      };
    } catch (error) {
      throw new RepositoryNotFoundError(`Repository ${this.owner}/${this.repo} not found.`, { cause: error });
    }
  }

  async getDefaultBranch(): Promise<string> {
    const metadata = await this.getMetadata();
    return metadata.defaultBranch;
  }

  async listFiles(ref?: string): Promise<RepositoryFile[]> {
    const tree = await this.getTree(ref);
    return tree.files;
  }

  async readFile(path: string, ref?: string): Promise<RepositoryFileContent> {
    const response = await this.octokit.rest.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
      ...(ref ? { ref } : {}),
    });
    if (Array.isArray(response.data) || response.data.type !== "file") {
      throw new FileNotFoundError(`"${path}" is not a file in ${this.owner}/${this.repo}.`);
    }
    return {
      path,
      content:
        response.data.encoding === "base64"
          ? Buffer.from(response.data.content, "base64").toString("utf8")
          : response.data.content,
      encoding: "utf8",
      sha: response.data.sha,
    };
  }

  async search(query: RepositorySearchQuery): Promise<RepositorySearchResult[]> {
    const qualifiers = [`repo:${this.owner}/${this.repo}`, query.pathPrefix ? `path:${query.pathPrefix}` : ""]
      .filter(Boolean)
      .join(" ");
    const response = await this.octokit.rest.search.code({
      q: `${query.query} ${qualifiers}`,
      per_page: query.limit ?? 30,
    });
    return response.data.items.map((item) => ({ path: item.path, snippet: item.name }));
  }

  async getTree(ref?: string): Promise<RepositoryTree> {
    const branch = ref ?? (await this.getDefaultBranch());
    const response = await this.octokit.rest.git.getTree({
      owner: this.owner,
      repo: this.repo,
      tree_sha: branch,
      recursive: "true",
    });
    const files: RepositoryFile[] = response.data.tree
      .filter((entry) => entry.path !== undefined)
      .map((entry) => ({
        path: entry.path!,
        type: entry.type === "tree" ? ("directory" as const) : ("file" as const),
        ...(entry.size !== undefined ? { size: entry.size } : {}),
      }));
    return { ref: branch, files };
  }
}
