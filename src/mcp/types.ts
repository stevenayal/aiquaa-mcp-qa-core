import type { SerializedQaCoreError } from "../errors/index.js";

export type ToolResponseFormat = "json" | "markdown" | "files" | "patch";

export interface ToolResponseMetadata {
  operationId: string;
  durationMs?: number;
  dryRun?: boolean;
  generatedAt: string;
}

export interface ToolResponse<T = unknown> {
  success: boolean;
  summary: string;
  data?: T;
  warnings: string[];
  assumptions: string[];
  errors: SerializedQaCoreError[];
  metadata: ToolResponseMetadata;
}

export interface McpTextContent {
  type: "text";
  text: string;
}

export interface McpToolResult {
  content: McpTextContent[];
  isError: boolean;
  structuredContent?: unknown;
}
