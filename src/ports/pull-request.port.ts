export interface RepositoryIdentifier {
  owner: string;
  repo: string;
}

export interface RepositoryPermissions {
  canRead: boolean;
  canWrite: boolean;
  canCreatePullRequest: boolean;
}

export interface CreateBranchInput {
  repository: RepositoryIdentifier;
  baseBranch: string;
  branchName: string;
}

export interface CreateBranchResult {
  branchName: string;
  baseSha: string;
  created: boolean;
}

export interface CommitChangesInput {
  repository: RepositoryIdentifier;
  branchName: string;
  message: string;
  files: Array<{ path: string; content: string | undefined }>;
}

export interface CommitChangesResult {
  commitSha: string;
  createdFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
}

export interface CreatePullRequestInput {
  repository: RepositoryIdentifier;
  baseBranch: string;
  headBranch: string;
  title: string;
  body: string;
  draft?: boolean;
}

export interface CreatePullRequestResult {
  number: number;
  url: string;
}

export interface GetPullRequestInput {
  repository: RepositoryIdentifier;
  number: number;
}

export interface PullRequestDetails {
  number: number;
  url: string;
  state: "open" | "closed" | "merged";
  title: string;
  headBranch: string;
  baseBranch: string;
}

export interface PullRequestResult {
  repository: string;
  baseBranch: string;
  headBranch: string;
  commitSha?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  dryRun: boolean;
  createdFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
}

export interface PullRequestPort {
  verifyPermissions(repository: RepositoryIdentifier): Promise<RepositoryPermissions>;
  createBranch(input: CreateBranchInput): Promise<CreateBranchResult>;
  commitChanges(input: CommitChangesInput): Promise<CommitChangesResult>;
  createPullRequest(input: CreatePullRequestInput): Promise<CreatePullRequestResult>;
  getPullRequest(input: GetPullRequestInput): Promise<PullRequestDetails>;
}
