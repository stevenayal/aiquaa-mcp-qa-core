export type ErrorCategory =
  | "validation"
  | "configuration"
  | "repository"
  | "filesystem"
  | "security"
  | "coverage"
  | "change_planning"
  | "patch"
  | "github"
  | "aiquaa"
  | "codegraph"
  | "memory"
  | "operation"
  | "process"
  | "timeout";

export interface SerializedQaCoreError {
  code: string;
  category: ErrorCategory;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export interface QaCoreErrorOptions {
  retryable?: boolean;
  details?: Record<string, unknown>;
  cause?: unknown;
}

/**
 * Base of every error the core throws or returns via Result.
 * Subclasses must never place secret values in `details` — see security/redaction.ts.
 */
export abstract class QaCoreError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(message: string, options: QaCoreErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = this.constructor.name;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }

  toJSON(): SerializedQaCoreError {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      retryable: this.retryable,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

function defineError(code: string, category: ErrorCategory, defaultRetryable = false) {
  return class extends QaCoreError {
    readonly code = code;
    readonly category = category;

    constructor(message: string, options: QaCoreErrorOptions = {}) {
      super(message, { retryable: defaultRetryable, ...options });
    }
  };
}

export class ValidationError extends defineError("VALIDATION_ERROR", "validation") {}
export class ConfigurationError extends defineError("CONFIGURATION_ERROR", "configuration") {}
export class RepositoryNotFoundError extends defineError(
  "REPOSITORY_NOT_FOUND",
  "repository",
) {}
export class RepositoryPermissionError extends defineError(
  "REPOSITORY_PERMISSION_ERROR",
  "repository",
) {}
export class FileNotFoundError extends defineError("FILE_NOT_FOUND", "filesystem") {}
export class UnsafePathError extends defineError("UNSAFE_PATH", "security") {}
export class SecretDetectedError extends defineError("SECRET_DETECTED", "security") {}
export class CoverageEvaluationError extends defineError(
  "COVERAGE_EVALUATION_ERROR",
  "coverage",
) {}
export class ChangePlanningError extends defineError("CHANGE_PLANNING_ERROR", "change_planning") {}
export class PatchGenerationError extends defineError("PATCH_GENERATION_ERROR", "patch") {}
export class PatchValidationError extends defineError("PATCH_VALIDATION_ERROR", "patch") {}
export class GitHubIntegrationError extends defineError("GITHUB_INTEGRATION_ERROR", "github") {}
export class AiquaaIntegrationError extends defineError("AIQUAA_INTEGRATION_ERROR", "aiquaa") {}
export class CodeGraphError extends defineError("CODEGRAPH_ERROR", "codegraph") {}
export class MemoryError extends defineError("MEMORY_ERROR", "memory") {}
export class OperationBlockedError extends defineError("OPERATION_BLOCKED", "operation") {}
export class ExternalProcessError extends defineError("EXTERNAL_PROCESS_ERROR", "process") {}
export class TimeoutError extends defineError("TIMEOUT_ERROR", "timeout", true) {}

export function serializeError(error: QaCoreError): SerializedQaCoreError {
  return error.toJSON();
}

export function isQaCoreError(value: unknown): value is QaCoreError {
  return value instanceof QaCoreError;
}

/** Wraps an unknown thrown value as a QaCoreError, preserving it if already one. */
export function toQaCoreError(value: unknown, fallbackCode = "UNKNOWN_ERROR"): QaCoreError {
  if (isQaCoreError(value)) return value;
  const message = value instanceof Error ? value.message : String(value);
  class UnknownError extends defineError(fallbackCode, "operation") {}
  return new UnknownError(message, { cause: value });
}
