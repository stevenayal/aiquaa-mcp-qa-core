import type { LoggerPort } from "../../ports/logger.port.js";

export class NoopLoggerAdapter implements LoggerPort {
  debug(_message?: string, _context?: Record<string, unknown>): void {
    // intentionally no-op
  }
  info(_message?: string, _context?: Record<string, unknown>): void {
    // intentionally no-op
  }
  warn(_message?: string, _context?: Record<string, unknown>): void {
    // intentionally no-op
  }
  error(_message?: string, _context?: Record<string, unknown>): void {
    // intentionally no-op
  }
}
