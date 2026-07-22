import { describe, expect, it } from "vitest";
import {
  ValidationError,
  TimeoutError,
  isQaCoreError,
  toQaCoreError,
  serializeError,
} from "./index.js";

describe("errors", () => {
  it("serializes to a safe plain object", () => {
    const error = new ValidationError("bad input", { details: { field: "title" } });
    const serialized = serializeError(error);
    expect(serialized).toEqual({
      code: "VALIDATION_ERROR",
      category: "validation",
      message: "bad input",
      retryable: false,
      details: { field: "title" },
    });
  });

  it("defaults retryable per error type", () => {
    expect(new ValidationError("x").retryable).toBe(false);
    expect(new TimeoutError("x").retryable).toBe(true);
  });

  it("identifies QaCoreError instances", () => {
    expect(isQaCoreError(new ValidationError("x"))).toBe(true);
    expect(isQaCoreError(new Error("x"))).toBe(false);
  });

  it("wraps unknown thrown values", () => {
    const original = new ValidationError("already typed");
    expect(toQaCoreError(original)).toBe(original);

    const wrapped = toQaCoreError(new Error("boom"));
    expect(wrapped.message).toBe("boom");
    expect(wrapped.category).toBe("operation");

    const wrappedString = toQaCoreError("plain string");
    expect(wrappedString.message).toBe("plain string");
  });
});
