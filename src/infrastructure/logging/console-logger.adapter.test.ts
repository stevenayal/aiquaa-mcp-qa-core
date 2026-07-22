import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleLoggerAdapter } from "./console-logger.adapter.js";

describe("ConsoleLoggerAdapter", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("suppresses messages below the configured level", () => {
    const logger = new ConsoleLoggerAdapter({ level: "warn" });
    logger.info("should not print");
    expect(logSpy).not.toHaveBeenCalled();
  });

  it("redacts secrets in the message and context", () => {
    const logger = new ConsoleLoggerAdapter({ level: "debug" });
    logger.info("token AKIAABCDEFGHIJKLMNOP", { detail: "AKIAABCDEFGHIJKLMNOP" });
    const line = logSpy.mock.calls[0]?.[0] as string;
    expect(line).not.toContain("AKIAABCDEFGHIJKLMNOP");
  });

  it("truncates long context values", () => {
    const logger = new ConsoleLoggerAdapter({ level: "debug", maxContextValueLength: 10 });
    logger.info("msg", { big: "x".repeat(100) });
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(payload.context.big.length).toBeLessThan(30);
  });

  it("invokes the telemetry hook for every log call regardless of level", () => {
    const events: string[] = [];
    const logger = new ConsoleLoggerAdapter({ level: "error", telemetryHook: (e) => events.push(e.message) });
    logger.debug("hidden from console");
    expect(events).toEqual(["hidden from console"]);
  });

  it("includes base context (operationId, projectId, repository)", () => {
    const logger = new ConsoleLoggerAdapter({ level: "debug", operationId: "op-1", projectId: "proj-1" });
    logger.info("msg");
    const payload = JSON.parse(logSpy.mock.calls[0]?.[0] as string);
    expect(payload.operationId).toBe("op-1");
    expect(payload.projectId).toBe("proj-1");
  });
});
