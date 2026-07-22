export type { LoggerPort, TelemetryHook } from "./logger.port.js";
export type { FileSystemPort } from "./filesystem.port.js";
export type {
  RepositoryMetadata,
  RepositoryFile,
  RepositoryFileContent,
  RepositorySearchQuery,
  RepositorySearchResult,
  RepositoryTree,
  RepositoryPort,
} from "./repository.port.js";
export type {
  PullRequestPort,
  RepositoryIdentifier,
  RepositoryPermissions,
  CreateBranchInput,
  CreateBranchResult,
  CommitChangesInput,
  CommitChangesResult,
  CreatePullRequestInput,
  CreatePullRequestResult,
  GetPullRequestInput,
  PullRequestDetails,
  PullRequestResult,
} from "./pull-request.port.js";
export type { AiquaaPort, SaveCoverageInput, SaveExecutionInput, LinkPullRequestInput } from "./aiquaa.port.js";
export type {
  CodeContextPort,
  CodeContextRequest,
  CodeContextResult,
  CodeContextFile,
  CodeSymbol,
  CodeRelationship,
} from "./code-context.port.js";
export type {
  ProjectMemoryPort,
  MemoryEntry,
  MemorySearchInput,
  MemorySaveInput,
} from "./memory.port.js";
