import { OperationBlockedError, TimeoutError } from "../errors/index.js";

export interface ExecutionRequest {
  command: string;
  args: string[];
  timeoutMs?: number;
}

export interface ExecutionPolicyOptions {
  allowedCommands: string[];
  defaultTimeoutMs?: number;
  maxTimeoutMs?: number;
}

/** Restricts which external binaries the core is allowed to invoke, and enforces timeouts. */
export class ExecutionPolicy {
  private readonly allowedCommands: Set<string>;
  private readonly defaultTimeoutMs: number;
  private readonly maxTimeoutMs: number;

  constructor(options: ExecutionPolicyOptions) {
    this.allowedCommands = new Set(options.allowedCommands);
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 30_000;
    this.maxTimeoutMs = options.maxTimeoutMs ?? 120_000;
  }

  assertAllowed(request: ExecutionRequest): number {
    if (!this.allowedCommands.has(request.command)) {
      throw new OperationBlockedError(`Command "${request.command}" is not in the allowed list.`, {
        details: { command: request.command },
      });
    }
    const timeoutMs = request.timeoutMs ?? this.defaultTimeoutMs;
    if (timeoutMs > this.maxTimeoutMs) {
      throw new TimeoutError(
        `Requested timeout ${timeoutMs}ms exceeds the maximum allowed ${this.maxTimeoutMs}ms.`,
        { details: { command: request.command, timeoutMs } },
      );
    }
    return timeoutMs;
  }
}
