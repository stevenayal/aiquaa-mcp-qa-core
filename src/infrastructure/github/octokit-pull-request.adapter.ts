import type { Octokit } from "@octokit/rest";
import { GitHubIntegrationError, RepositoryPermissionError } from "../../errors/index.js";
import type {
  CommitChangesInput,
  CommitChangesResult,
  CreateBranchInput,
  CreateBranchResult,
  CreatePullRequestInput,
  CreatePullRequestResult,
  GetPullRequestInput,
  PullRequestDetails,
  PullRequestPort,
  RepositoryIdentifier,
  RepositoryPermissions,
} from "../../ports/pull-request.port.js";

export interface OctokitPullRequestAdapterOptions {
  octokit: Octokit;
}

/**
 * PullRequestPort implementation over @octokit/rest, using the Git Data API
 * (blobs/tree/commit) so a multi-file change lands as a single atomic commit.
 */
export class OctokitPullRequestAdapter implements PullRequestPort {
  private readonly octokit: Octokit;

  constructor(options: OctokitPullRequestAdapterOptions) {
    this.octokit = options.octokit;
  }

  async verifyPermissions(repository: RepositoryIdentifier): Promise<RepositoryPermissions> {
    try {
      const response = await this.octokit.rest.repos.get({ owner: repository.owner, repo: repository.repo });
      const permissions = response.data.permissions;
      const canWrite = permissions?.push ?? false;
      return { canRead: true, canWrite, canCreatePullRequest: canWrite };
    } catch (error) {
      throw new RepositoryPermissionError(
        `Unable to verify permissions on ${repository.owner}/${repository.repo}.`,
        { cause: error },
      );
    }
  }

  async createBranch(input: CreateBranchInput): Promise<CreateBranchResult> {
    const { owner, repo } = input.repository;
    const baseRef = await this.octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${input.baseBranch}`,
    });
    const baseSha = baseRef.data.object.sha;

    const existing = await this.octokit.rest.git
      .getRef({ owner, repo, ref: `heads/${input.branchName}` })
      .then(() => true)
      .catch(() => false);

    if (!existing) {
      await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${input.branchName}`,
        sha: baseSha,
      });
    }

    return { branchName: input.branchName, baseSha, created: !existing };
  }

  async commitChanges(input: CommitChangesInput): Promise<CommitChangesResult> {
    const { owner, repo } = input.repository;
    const branchRef = await this.octokit.rest.git.getRef({ owner, repo, ref: `heads/${input.branchName}` });
    const baseCommitSha = branchRef.data.object.sha;
    const baseCommit = await this.octokit.rest.git.getCommit({ owner, repo, commit_sha: baseCommitSha });
    const baseTreeSha = baseCommit.data.tree.sha;

    const createdFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const deletedFiles: string[] = [];

    const treeEntries = await Promise.all(
      input.files.map(async (file) => {
        if (file.content === undefined) {
          deletedFiles.push(file.path);
          return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: null };
        }
        const blob = await this.octokit.rest.git.createBlob({
          owner,
          repo,
          content: file.content,
          encoding: "utf-8",
        });
        modifiedFiles.push(file.path);
        return { path: file.path, mode: "100644" as const, type: "blob" as const, sha: blob.data.sha };
      }),
    );

    const newTree = await this.octokit.rest.git.createTree({
      owner,
      repo,
      base_tree: baseTreeSha,
      tree: treeEntries,
    });

    const newCommit = await this.octokit.rest.git.createCommit({
      owner,
      repo,
      message: input.message,
      tree: newTree.data.sha,
      parents: [baseCommitSha],
    });

    await this.octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${input.branchName}`,
      sha: newCommit.data.sha,
    });

    return { commitSha: newCommit.data.sha, createdFiles, modifiedFiles, deletedFiles };
  }

  async createPullRequest(input: CreatePullRequestInput): Promise<CreatePullRequestResult> {
    try {
      const response = await this.octokit.rest.pulls.create({
        owner: input.repository.owner,
        repo: input.repository.repo,
        title: input.title,
        body: input.body,
        head: input.headBranch,
        base: input.baseBranch,
        draft: input.draft ?? true,
      });
      return { number: response.data.number, url: response.data.html_url };
    } catch (error) {
      throw new GitHubIntegrationError(
        `Failed to create pull request on ${input.repository.owner}/${input.repository.repo}.`,
        { cause: error },
      );
    }
  }

  async getPullRequest(input: GetPullRequestInput): Promise<PullRequestDetails> {
    const response = await this.octokit.rest.pulls.get({
      owner: input.repository.owner,
      repo: input.repository.repo,
      pull_number: input.number,
    });
    const state: PullRequestDetails["state"] = response.data.merged
      ? "merged"
      : response.data.state === "closed"
        ? "closed"
        : "open";
    return {
      number: response.data.number,
      url: response.data.html_url,
      state,
      title: response.data.title,
      headBranch: response.data.head.ref,
      baseBranch: response.data.base.ref,
    };
  }
}
