import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors/index.js";
import { createToolFailure, createToolSuccess, serializeToolResponse } from "./tool-response.js";

describe("tool response helpers", () => {
  it("builds a success response with defaults", () => {
    const response = createToolSuccess({ operationId: "op-1", summary: "done", data: { count: 3 } });
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ count: 3 });
    expect(response.warnings).toEqual([]);
    expect(response.errors).toEqual([]);
    expect(response.metadata.operationId).toBe("op-1");
  });

  it("builds a failure response with serialized errors", () => {
    const response = createToolFailure({
      operationId: "op-2",
      summary: "failed",
      errors: [new ValidationError("bad input")],
    });
    expect(response.success).toBe(false);
    expect(response.errors).toEqual([
      { code: "VALIDATION_ERROR", category: "validation", message: "bad input", retryable: false },
    ]);
  });

  it("serializes to pretty JSON", () => {
    const response = createToolSuccess({ operationId: "op-3", summary: "done" });
    const json = serializeToolResponse(response);
    expect(JSON.parse(json)).toEqual(response);
  });
});
