import { describe, expect, it } from "vitest";
import { createToolFailure, createToolSuccess } from "./tool-response.js";
import { toMcpStructuredContent, toMcpTextContent } from "./formatters.js";
import { ValidationError } from "../errors/index.js";

describe("MCP content formatters", () => {
  it("renders json format by default", () => {
    const response = createToolSuccess({ operationId: "op-1", summary: "done", data: { a: 1 } });
    const content = toMcpTextContent(response);
    expect(content[0]?.type).toBe("text");
    expect(JSON.parse(content[0]!.text)).toEqual(response);
  });

  it("renders markdown with warnings and errors sections", () => {
    const response = createToolFailure({
      operationId: "op-2",
      summary: "failed",
      errors: [new ValidationError("bad")],
      warnings: ["careful"],
    });
    const content = toMcpTextContent(response, "markdown");
    expect(content[0]!.text).toContain("## Warnings");
    expect(content[0]!.text).toContain("## Errors");
  });

  it("renders a files table", () => {
    const response = createToolSuccess({
      operationId: "op-3",
      summary: "done",
      data: [{ path: "a.ts", operation: "create" }],
    });
    const content = toMcpTextContent(response, "files");
    expect(content[0]!.text).toContain("| a.ts | create |");
  });

  it("renders a patch diff block", () => {
    const response = createToolSuccess({
      operationId: "op-4",
      summary: "done",
      data: [{ path: "a.ts", unifiedDiff: "+added line" }],
    });
    const content = toMcpTextContent(response, "patch");
    expect(content[0]!.text).toContain("+added line");
  });

  it("toMcpStructuredContent sets isError from response.success", () => {
    const failure = createToolFailure({ operationId: "op-5", summary: "failed", errors: [] });
    const result = toMcpStructuredContent(failure);
    expect(result.isError).toBe(true);

    const success = createToolSuccess({ operationId: "op-6", summary: "done", data: { x: 1 } });
    const okResult = toMcpStructuredContent(success);
    expect(okResult.isError).toBe(false);
    expect(okResult.structuredContent).toEqual({ x: 1 });
  });
});
