import { describe, expect, it } from "vitest";
import { SecretScanner } from "./secret-scanner.js";

describe("SecretScanner", () => {
  const scanner = new SecretScanner();

  it("detects a GitHub token", () => {
    const findings = scanner.scanText(`token = "ghp_${"a".repeat(36)}"`);
    expect(findings.some((f) => f.type === "github_token")).toBe(true);
  });

  it("detects an AWS access key", () => {
    const findings = scanner.scanText("AKIAABCDEFGHIJKLMNOP");
    expect(findings.some((f) => f.type === "aws_access_key")).toBe(true);
  });

  it("detects a private key block", () => {
    const findings = scanner.scanText("-----BEGIN RSA PRIVATE KEY-----\nMIIB...");
    expect(findings.some((f) => f.type === "private_key")).toBe(true);
  });

  it("never returns the full secret value", () => {
    const secret = `ghp_${"b".repeat(40)}`;
    const findings = scanner.scanText(secret);
    expect(findings[0]?.redactedValue).not.toContain(secret);
  });

  it("reports line numbers", () => {
    const findings = scanner.scanText(`line one\nAKIAABCDEFGHIJKLMNOP\nline three`, { path: "config.ts" });
    expect(findings[0]).toMatchObject({ line: 2, path: "config.ts" });
  });

  it("returns no findings for clean text", () => {
    expect(scanner.hasSecrets("just some regular code content")).toBe(false);
  });

  it("scans multiple files", () => {
    const findings = scanner.scanFiles([
      { path: "a.ts", content: "const x = 1;" },
      { path: "b.ts", content: "AKIAABCDEFGHIJKLMNOP" },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.path).toBe("b.ts");
  });
});
