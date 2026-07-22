import { describe, expect, it } from "vitest";
import { OperationBlockedError, TimeoutError } from "../errors/index.js";
import { ExecutionPolicy } from "./execution-policy.js";

describe("ExecutionPolicy", () => {
  it("allows a whitelisted command and returns the effective timeout", () => {
    const policy = new ExecutionPolicy({ allowedCommands: ["codegraph"], defaultTimeoutMs: 5_000 });
    expect(policy.assertAllowed({ command: "codegraph", args: ["status"] })).toBe(5_000);
  });

  it("blocks a command not in the allow-list", () => {
    const policy = new ExecutionPolicy({ allowedCommands: ["codegraph"] });
    expect(() => policy.assertAllowed({ command: "rm", args: ["-rf", "/"] })).toThrow(OperationBlockedError);
  });

  it("rejects a timeout above the configured maximum", () => {
    const policy = new ExecutionPolicy({ allowedCommands: ["codegraph"], maxTimeoutMs: 10_000 });
    expect(() => policy.assertAllowed({ command: "codegraph", args: [], timeoutMs: 60_000 })).toThrow(TimeoutError);
  });
});
