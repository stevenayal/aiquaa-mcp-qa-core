import type { QaCoreConfig } from "../config/types.js";
import type { LoggerPort } from "../ports/logger.port.js";
import type { RepositoryPort } from "../ports/repository.port.js";
import type { PullRequestPort } from "../ports/pull-request.port.js";
import type { AiquaaPort } from "../ports/aiquaa.port.js";
import type { CodeContextPort } from "../ports/code-context.port.js";
import type { ProjectMemoryPort } from "../ports/memory.port.js";

export interface QaCoreContext {
  config: QaCoreConfig;
  logger: LoggerPort;
  repository?: RepositoryPort;
  pullRequests?: PullRequestPort;
  aiquaa?: AiquaaPort;
  codeContext?: CodeContextPort;
  memory?: ProjectMemoryPort;
  operationId: string;
  dryRun: boolean;
}
