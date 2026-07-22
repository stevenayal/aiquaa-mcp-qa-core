import { describe, expect, it } from "vitest";
import { redact, RedactionService } from "./redaction.js";

describe("redaction", () => {
  it("masks a secret found in free text", () => {
    const text = `key is AKIAABCDEFGHIJKLMNOP please rotate`;
    const redacted = redact(text);
    expect(redacted).not.toContain("AKIAABCDEFGHIJKLMNOP");
  });

  it("leaves clean text untouched", () => {
    expect(redact("hello world")).toBe("hello world");
  });

  it("RedactionService redacts nested objects", () => {
    const service = new RedactionService();
    const result = service.redactObject({
      note: "token AKIAABCDEFGHIJKLMNOP",
      nested: { again: "AKIAABCDEFGHIJKLMNOP" },
      list: ["AKIAABCDEFGHIJKLMNOP"],
      count: 3,
    });
    expect(result.note).not.toContain("AKIAABCDEFGHIJKLMNOP");
    expect(result.nested.again).not.toContain("AKIAABCDEFGHIJKLMNOP");
    expect(result.list[0]).not.toContain("AKIAABCDEFGHIJKLMNOP");
    expect(result.count).toBe(3);
  });
});
