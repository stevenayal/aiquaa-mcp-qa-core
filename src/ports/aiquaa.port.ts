export interface SaveCoverageInput {
  projectId: string;
  operationId: string;
  coverage: unknown;
}

export interface SaveExecutionInput {
  projectId: string;
  operationId: string;
  execution: unknown;
}

export interface LinkPullRequestInput {
  projectId: string;
  requirementIds: string[];
  pullRequestUrl: string;
}

export interface AiquaaPort {
  getProject(projectId: string): Promise<unknown>;
  getRequirement(projectId: string, requirementId: string): Promise<unknown>;
  listBusinessRules(projectId: string): Promise<unknown[]>;
  saveCoverage(input: SaveCoverageInput): Promise<void>;
  saveExecution(input: SaveExecutionInput): Promise<void>;
  linkPullRequest(input: LinkPullRequestInput): Promise<void>;
}
