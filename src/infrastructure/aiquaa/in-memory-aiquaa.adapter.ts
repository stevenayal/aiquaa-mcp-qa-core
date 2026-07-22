import type {
  AiquaaPort,
  LinkPullRequestInput,
  SaveCoverageInput,
  SaveExecutionInput,
} from "../../ports/aiquaa.port.js";

export interface InMemoryAiquaaState {
  projects: Record<string, unknown>;
  requirements: Record<string, Record<string, unknown>>;
  businessRules: Record<string, unknown[]>;
  savedCoverage: SaveCoverageInput[];
  savedExecutions: SaveExecutionInput[];
  linkedPullRequests: LinkPullRequestInput[];
}

/** In-memory AiquaaPort for tests and offline development. */
export class InMemoryAiquaaAdapter implements AiquaaPort {
  readonly state: InMemoryAiquaaState = {
    projects: {},
    requirements: {},
    businessRules: {},
    savedCoverage: [],
    savedExecutions: [],
    linkedPullRequests: [],
  };

  async getProject(projectId: string): Promise<unknown> {
    return this.state.projects[projectId];
  }

  async getRequirement(projectId: string, requirementId: string): Promise<unknown> {
    return this.state.requirements[projectId]?.[requirementId];
  }

  async listBusinessRules(projectId: string): Promise<unknown[]> {
    return this.state.businessRules[projectId] ?? [];
  }

  async saveCoverage(input: SaveCoverageInput): Promise<void> {
    this.state.savedCoverage.push(input);
  }

  async saveExecution(input: SaveExecutionInput): Promise<void> {
    this.state.savedExecutions.push(input);
  }

  async linkPullRequest(input: LinkPullRequestInput): Promise<void> {
    this.state.linkedPullRequests.push(input);
  }
}
