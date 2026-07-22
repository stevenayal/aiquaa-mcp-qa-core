import { describe, expect, it } from "vitest";
import { InputSanitizer } from "./input-sanitizer.js";

describe("InputSanitizer", () => {
  const sanitizer = new InputSanitizer();

  it("strips control characters", () => {
    expect(sanitizer.sanitizeText("helloworld")).toBe("helloworld");
  });

  it("clamps text length", () => {
    expect(sanitizer.sanitizeText("a".repeat(100), 10)).toHaveLength(10);
  });

  it("sanitizes identifiers to a safe charset", () => {
    expect(sanitizer.sanitizeIdentifier("req 1/../weird*id")).toBe("req1..weirdid");
  });
});
