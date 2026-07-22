import { describe, expect, it } from "vitest";
import { OperationBlockedError } from "../errors/index.js";
import { HostPolicy } from "./host-policy.js";

describe("HostPolicy", () => {
  const policy = new HostPolicy({ allowedHosts: ["api.aiquaa.dev"] });

  it("allows an exact host match", () => {
    expect(() => policy.assertAllowed("https://api.aiquaa.dev/projects")).not.toThrow();
  });

  it("allows a subdomain of an allowed host", () => {
    expect(() => policy.assertAllowed("https://staging.api.aiquaa.dev/projects")).not.toThrow();
  });

  it("blocks an unrelated host", () => {
    expect(() => policy.assertAllowed("https://evil.example.com")).toThrow(OperationBlockedError);
  });

  it("blocks an invalid URL", () => {
    expect(() => policy.assertAllowed("not-a-url")).toThrow(OperationBlockedError);
  });

  it("isAllowed returns a boolean", () => {
    expect(policy.isAllowed("https://api.aiquaa.dev")).toBe(true);
    expect(policy.isAllowed("https://evil.example.com")).toBe(false);
  });
});
