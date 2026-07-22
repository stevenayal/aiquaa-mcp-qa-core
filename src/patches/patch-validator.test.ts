import path from "node:path";
import { describe, expect, it } from "vitest";
import { PathPolicy } from "../security/path-policy.js";
import { PatchValidator } from "./patch-validator.js";
import { PatchValidationError } from "../errors/index.js";

function makeValidator() {
  return new PatchValidator({ pathPolicy: new PathPolicy({ allowedRoots: [path.resolve("workspace")] }) });
}

describe("PatchValidator", () => {
  it("accepts a valid create", () => {
    const validator = makeValidator();
    const result = validator.validate([
      { path: "tests/a.spec.ts", operation: "create", nextContent: "test('x', () => {});", reason: "new" },
    ]);
    expect(result.valid).toBe(true);
  });

  it("flags an unsafe path", () => {
    const validator = makeValidator();
    const result = validator.validate([
      { path: "../outside.ts", operation: "create", nextContent: "x", reason: "new" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("flags update/delete without previous content", () => {
    const validator = makeValidator();
    const result = validator.validate([{ path: "tests/a.ts", operation: "update", nextContent: "x", reason: "r" }]);
    expect(result.valid).toBe(false);
  });

  it("flags a secret in the new content", () => {
    const validator = makeValidator();
    const result = validator.validate([
      { path: "tests/a.ts", operation: "create", nextContent: "AKIAABCDEFGHIJKLMNOP", reason: "r" },
    ]);
    expect(result.valid).toBe(false);
  });

  it("assertValid throws PatchValidationError on failure", () => {
    const validator = makeValidator();
    expect(() =>
      validator.assertValid([{ path: "../outside.ts", operation: "create", nextContent: "x", reason: "r" }]),
    ).toThrow(PatchValidationError);
  });
});
