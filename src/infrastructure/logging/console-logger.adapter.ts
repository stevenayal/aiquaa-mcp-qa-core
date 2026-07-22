import type { LoggerPort, TelemetryHook } from "../../ports/logger.port.js";
import { redact } from "../../security/redaction.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface ConsoleLoggerOptions {
  level?: LogLevel;
  operationId?: string;
  projectId?: string;
  repository?: string;
  maxContextValueLength?: number;
  telemetryHook?: TelemetryHook;
}

/** Structured JSON console logger with automatic secret redaction and value truncation. */
export class ConsoleLoggerAdapter implements LoggerPort {
  private readonly level: LogLevel;
  private readonly baseContext: Record<string, unknown>;
  private readonly maxContextValueLength: number;
  private readonly telemetryHook: TelemetryHook | undefined;

  constructor(options: ConsoleLoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.maxContextValueLength = options.maxContextValueLength ?? 500;
    this.telemetryHook = options.telemetryHook;
    this.baseContext = {
      ...(options.operationId ? { operationId: options.operationId } : {}),
      ...(options.projectId ? { projectId: options.projectId } : {}),
      ...(options.repository ? { repository: options.repository } : {}),
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    this.telemetryHook?.({ level, message, context, timestamp });

    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.level]) return;

    const sanitizedContext = context ? this.sanitizeContext(context) : undefined;
    const payload = {
      level,
      time: timestamp,
      message: redact(message),
      ...this.baseContext,
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
    };
    const line = JSON.stringify(payload);
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  private sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(context)) {
      result[key] = this.sanitizeValue(value);
    }
    return result;
  }

  private sanitizeValue(value: unknown): unknown {
    if (typeof value === "string") {
      const redacted = redact(value);
      return redacted.length > this.maxContextValueLength
        ? `${redacted.slice(0, this.maxContextValueLength)}…[truncated]`
        : redacted;
    }
    if (Array.isArray(value)) return value.map((item) => this.sanitizeValue(item));
    if (value && typeof value === "object") {
      return this.sanitizeContext(value as Record<string, unknown>);
    }
    return value;
  }
}
