import path from "node:path";
import { describe, expect, it } from "vitest";
import { OperationBlockedError, SecretDetectedError } from "../errors/index.js";
import { PathPolicy } from "./path-policy.js";
import { RepositoryWritePolicy } from "./repository-write-policy.js";

function makePolicy() {
  const pathPolicy = new PathPolicy({ allowedRoots: [path.resolve("workspace")] });
  return new RepositoryWritePolicy({ pathPolicy });
}

describe("RepositoryWritePolicy", () => {
  it("allows a well-formed in-scope write", () => {
    const policy = makePolicy();
    expect(() =>
      policy.assertAllowed({
        repository: "owner/repo",
        baseBranch: "main",
        scope: ["tests"],
        files: [{ path: "tests/a.spec.ts", content: "test('x', () => {});" }],
      }),
    ).not.toThrow();
  });

  it("blocks when repository is missing", () => {
    const policy = makePolicy();
    expect(() =>
      policy.assertAllowed({ repository: "", baseBranch: "main", scope: ["tests"], files: [{ path: "tests/a.ts", content: "x" }] }),
    ).toThrow(OperationBlockedError);
  });

  it("blocks when scope is empty", () => {
    const policy = makePolicy();
    expect(() =>
      policy.assertAllowed({
        repository: "owner/repo",
        baseBranch: "main",
        scope: [],
        files: [{ path: "tests/a.ts", content: "x" }],
      }),
    ).toThrow(OperationBlockedError);
  });

  it("blocks a file outside the declared scope", () => {
    const policy = makePolicy();
    expect(() =>
      policy.assertAllowed({
        repository: "owner/repo",
        baseBranch: "main",
        scope: ["tests"],
        files: [{ path: "src/app.ts", content: "x" }],
      }),
    ).toThrow(OperationBlockedError);
  });

  it("blocks a file containing a secret", () => {
    const policy = makePolicy();
    expect(() =>
      policy.assertAllowed({
        repository: "owner/repo",
        baseBranch: "main",
        scope: ["tests"],
        files: [{ path: "tests/a.ts", content: "AKIAABCDEFGHIJKLMNOP" }],
      }),
    ).toThrow(SecretDetectedError);
  });

  it("defaults isDryRun to true", () => {
    const policy = makePolicy();
    expect(policy.isDryRun({ repository: "r", baseBranch: "main", scope: ["a"], files: [] })).toBe(true);
    expect(policy.isDryRun({ repository: "r", baseBranch: "main", scope: ["a"], files: [], dryRun: false })).toBe(
      false,
    );
  });
});
