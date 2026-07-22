import { describe, expect, it } from "vitest";
import { NoopLoggerAdapter } from "./noop-logger.adapter.js";

describe("NoopLoggerAdapter", () => {
  it("does nothing on any call", () => {
    const logger = new NoopLoggerAdapter();
    expect(() => {
      logger.debug("x");
      logger.info("x");
      logger.warn("x");
      logger.error("x");
    }).not.toThrow();
  });
});
