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
} from "../ports/pull-request.port.js";

export interface InMemoryPullRequestAdapterOptions {
  permissions?: RepositoryPermissions;
}

/** In-memory PullRequestPort for unit tests — records every call, never touches GitHub. */
export class InMemoryPullRequestAdapter implements PullRequestPort {
  readonly branches = new Map<string, string>();
  readonly commits: CommitChangesInput[] = [];
  readonly pullRequests: CreatePullRequestInput[] = [];
  private readonly permissions: RepositoryPermissions;
  private nextPullRequestNumber = 1;

  constructor(options: InMemoryPullRequestAdapterOptions = {}) {
    this.permissions = options.permissions ?? { canRead: true, canWrite: true, canCreatePullRequest: true };
  }

  async verifyPermissions(_repository: RepositoryIdentifier): Promise<RepositoryPermissions> {
    return this.permissions;
  }

  async createBranch(input: CreateBranchInput): Promise<CreateBranchResult> {
    const key = `${input.repository.owner}/${input.repository.repo}#${input.branchName}`;
    const created = !this.branches.has(key);
    this.branches.set(key, input.baseBranch);
    return { branchName: input.branchName, baseSha: "0000000000000000000000000000000000000000", created };
  }

  async commitChanges(input: CommitChangesInput): Promise<CommitChangesResult> {
    this.commits.push(input);
    return {
      commitSha: `sha-${this.commits.length}`,
      createdFiles: input.files.filter((f) => f.content !== undefined).map((f) => f.path),
      modifiedFiles: [],
      deletedFiles: input.files.filter((f) => f.content === undefined).map((f) => f.path),
    };
  }

  async createPullRequest(input: CreatePullRequestInput): Promise<CreatePullRequestResult> {
    this.pullRequests.push(input);
    const number = this.nextPullRequestNumber;
    this.nextPullRequestNumber += 1;
    return { number, url: `https://github.com/${input.repository.owner}/${input.repository.repo}/pull/${number}` };
  }

  async getPullRequest(input: GetPullRequestInput): Promise<PullRequestDetails> {
    const pullRequest = this.pullRequests[input.number - 1];
    if (!pullRequest) {
      return {
        number: input.number,
        url: `https://github.com/${input.repository.owner}/${input.repository.repo}/pull/${input.number}`,
        state: "open",
        title: "unknown",
        headBranch: "unknown",
        baseBranch: "unknown",
      };
    }
    return {
      number: input.number,
      url: `https://github.com/${input.repository.owner}/${input.repository.repo}/pull/${input.number}`,
      state: "open",
      title: pullRequest.title,
      headBranch: pullRequest.headBranch,
      baseBranch: pullRequest.baseBranch,
    };
  }
}
