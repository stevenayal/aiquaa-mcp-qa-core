import type { LoggerPort } from "../ports/logger.port.js";

export interface TestLogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  context?: Record<string, unknown>;
}

/** LoggerPort that records entries in memory so tests can assert on them. */
export class TestLoggerAdapter implements LoggerPort {
  readonly entries: TestLogEntry[] = [];

  debug(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "debug", message, ...(context ? { context } : {}) });
  }
  info(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "info", message, ...(context ? { context } : {}) });
  }
  warn(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "warn", message, ...(context ? { context } : {}) });
  }
  error(message: string, context?: Record<string, unknown>): void {
    this.entries.push({ level: "error", message, ...(context ? { context } : {}) });
  }

  clear(): void {
    this.entries.length = 0;
  }
}
