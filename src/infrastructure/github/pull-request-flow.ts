import { OperationBlockedError } from "../../errors/index.js";
import type { PullRequestPort, RepositoryIdentifier, PullRequestResult } from "../../ports/pull-request.port.js";
import type { FileChange } from "../../patches/types.js";

export interface RunPullRequestFlowInput {
  repository: RepositoryIdentifier;
  baseBranch: string;
  branchName: string;
  commitMessage: string;
  title: string;
  body: string;
  files: FileChange[];
  dryRun?: boolean;
  draft?: boolean;
}

/**
 * Standard 10-step PR flow: verify → base branch → branch name → create branch →
 * apply changes → commit → open draft PR → return results. dryRun and draft
 * both default to true so nothing is written without an explicit opt-out.
 */
export async function runPullRequestFlow(
  port: PullRequestPort,
  input: RunPullRequestFlowInput,
): Promise<PullRequestResult> {
  const dryRun = input.dryRun ?? true;
  const draft = input.draft ?? true;
  const repoLabel = `${input.repository.owner}/${input.repository.repo}`;

  const permissions = await port.verifyPermissions(input.repository);
  if (!permissions.canWrite) {
    throw new OperationBlockedError(`Missing write permission on ${repoLabel}.`);
  }

  const createdFiles = input.files.filter((f) => f.operation === "create").map((f) => f.path);
  const modifiedFiles = input.files.filter((f) => f.operation === "update").map((f) => f.path);
  const deletedFiles = input.files.filter((f) => f.operation === "delete").map((f) => f.path);

  if (dryRun) {
    return {
      repository: repoLabel,
      baseBranch: input.baseBranch,
      headBranch: input.branchName,
      dryRun: true,
      createdFiles,
      modifiedFiles,
      deletedFiles,
    };
  }

  await port.createBranch({
    repository: input.repository,
    baseBranch: input.baseBranch,
    branchName: input.branchName,
  });

  const commit = await port.commitChanges({
    repository: input.repository,
    branchName: input.branchName,
    message: input.commitMessage,
    files: input.files
      .filter((f) => f.operation !== "keep")
      .map((f) => ({ path: f.path, content: f.operation === "delete" ? undefined : f.nextContent })),
  });

  const pullRequest = await port.createPullRequest({
    repository: input.repository,
    baseBranch: input.baseBranch,
    headBranch: input.branchName,
    title: input.title,
    body: input.body,
    draft,
  });

  return {
    repository: repoLabel,
    baseBranch: input.baseBranch,
    headBranch: input.branchName,
    commitSha: commit.commitSha,
    pullRequestNumber: pullRequest.number,
    pullRequestUrl: pullRequest.url,
    dryRun: false,
    createdFiles: commit.createdFiles,
    modifiedFiles: commit.modifiedFiles,
    deletedFiles: commit.deletedFiles,
  };
}
