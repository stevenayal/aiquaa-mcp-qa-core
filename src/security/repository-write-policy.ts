import { OperationBlockedError, SecretDetectedError } from "../errors/index.js";
import { SecretScanner } from "./secret-scanner.js";
import type { PathPolicy } from "./path-policy.js";

export interface RepositoryWriteRequest {
  repository: string;
  baseBranch: string;
  scope: string[];
  files: Array<{ path: string; content: string }>;
  dryRun?: boolean;
}

export interface RepositoryWritePolicyOptions {
  pathPolicy: PathPolicy;
  secretScanner?: SecretScanner;
}

/**
 * Gate every write-to-repository operation. Defaults to dryRun=true and requires
 * an explicit scope + file list so writes can never silently touch unexpected paths.
 */
export class RepositoryWritePolicy {
  private readonly pathPolicy: PathPolicy;
  private readonly secretScanner: SecretScanner;

  constructor(options: RepositoryWritePolicyOptions) {
    this.pathPolicy = options.pathPolicy;
    this.secretScanner = options.secretScanner ?? new SecretScanner();
  }

  assertAllowed(request: RepositoryWriteRequest): void {
    if (!request.repository) {
      throw new OperationBlockedError("Repository write blocked: repository is not identified.");
    }
    if (!request.baseBranch) {
      throw new OperationBlockedError("Repository write blocked: base branch is not identified.");
    }
    if (request.scope.length === 0) {
      throw new OperationBlockedError("Repository write blocked: scope must be explicit and non-empty.");
    }
    if (request.files.length === 0) {
      throw new OperationBlockedError("Repository write blocked: no files were provided.");
    }

    for (const file of request.files) {
      this.pathPolicy.assertSafe(file.path);
      const inScope = request.scope.some((scoped) => file.path === scoped || file.path.startsWith(`${scoped}/`));
      if (!inScope) {
        throw new OperationBlockedError(
          `Repository write blocked: "${file.path}" is out of the declared scope.`,
          { details: { path: file.path, scope: request.scope } },
        );
      }
      const findings = this.secretScanner.scanText(file.content, { path: file.path });
      if (findings.length > 0) {
        throw new SecretDetectedError(
          `Repository write blocked: potential secret(s) detected in "${file.path}".`,
          { details: { path: file.path, types: findings.map((f) => f.type) } },
        );
      }
    }
  }

  isDryRun(request: RepositoryWriteRequest): boolean {
    return request.dryRun ?? true;
  }
}
