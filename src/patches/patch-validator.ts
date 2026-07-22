import { PatchValidationError } from "../errors/index.js";
import { SecretScanner } from "../security/secret-scanner.js";
import type { PathPolicy } from "../security/path-policy.js";
import type { FileChange } from "./types.js";

export interface PatchValidationIssue {
  path: string;
  message: string;
}

export interface PatchValidationResult {
  valid: boolean;
  issues: PatchValidationIssue[];
}

export interface PatchValidatorOptions {
  pathPolicy: PathPolicy;
  secretScanner?: SecretScanner;
}

export class PatchValidator {
  private readonly pathPolicy: PathPolicy;
  private readonly secretScanner: SecretScanner;

  constructor(options: PatchValidatorOptions) {
    this.pathPolicy = options.pathPolicy;
    this.secretScanner = options.secretScanner ?? new SecretScanner();
  }

  validate(changes: FileChange[]): PatchValidationResult {
    const issues: PatchValidationIssue[] = [];

    for (const change of changes) {
      if (!this.pathPolicy.isSafe(change.path)) {
        issues.push({ path: change.path, message: "Path is outside the allowed workspace or unsafe." });
        continue;
      }
      if ((change.operation === "update" || change.operation === "delete") && change.previousContent === undefined) {
        issues.push({
          path: change.path,
          message: `Cannot ${change.operation} "${change.path}" without its previous content — read it first.`,
        });
      }
      if ((change.operation === "create" || change.operation === "update") && change.nextContent !== undefined) {
        const findings = this.secretScanner.scanText(change.nextContent, { path: change.path });
        if (findings.length > 0) {
          issues.push({
            path: change.path,
            message: `Potential secret(s) detected: ${findings.map((f) => f.type).join(", ")}.`,
          });
        }
      }
    }

    return { valid: issues.length === 0, issues };
  }

  assertValid(changes: FileChange[]): void {
    const result = this.validate(changes);
    if (!result.valid) {
      throw new PatchValidationError("Patch validation failed.", {
        details: { issues: result.issues },
      });
    }
  }
}
