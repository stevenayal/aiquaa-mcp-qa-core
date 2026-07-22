import type { ToolResponse, ToolResponseFormat, McpTextContent, McpToolResult } from "./types.js";

interface FileLike {
  path?: string;
  operation?: string;
}

interface PatchLike {
  path?: string;
  unifiedDiff?: string;
}

function isRecordArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((item) => typeof item === "object" && item !== null);
}

function renderMarkdown<T>(response: ToolResponse<T>): string {
  const lines: string[] = [
    `# ${response.success ? "OK" : "Failed"} — ${response.summary}`,
    "",
    `Operation: \`${response.metadata.operationId}\` · Generated: ${response.metadata.generatedAt}`,
  ];
  if (response.metadata.dryRun !== undefined) lines.push(`Dry run: ${response.metadata.dryRun}`);
  if (response.warnings.length > 0) {
    lines.push("", "## Warnings", ...response.warnings.map((warning) => `- ${warning}`));
  }
  if (response.assumptions.length > 0) {
    lines.push("", "## Assumptions", ...response.assumptions.map((assumption) => `- ${assumption}`));
  }
  if (response.errors.length > 0) {
    lines.push("", "## Errors", ...response.errors.map((error) => `- **${error.code}**: ${error.message}`));
  }
  if (response.data !== undefined) {
    lines.push("", "## Data", "```json", JSON.stringify(response.data, null, 2), "```");
  }
  return lines.join("\n");
}

function renderFiles<T>(response: ToolResponse<T>): string {
  const data = response.data;
  if (!isRecordArray(data)) return renderMarkdown(response);
  const rows = (data as FileLike[]).map(
    (file) => `| ${file.path ?? "—"} | ${file.operation ?? "—"} |`,
  );
  return ["# Files", "", "| Path | Operation |", "|---|---|", ...rows].join("\n");
}

function renderPatch<T>(response: ToolResponse<T>): string {
  const data = response.data;
  if (!isRecordArray(data)) return renderMarkdown(response);
  return (data as PatchLike[])
    .flatMap((patch) => [`## ${patch.path ?? "unknown"}`, "", "```diff", patch.unifiedDiff ?? "", "```", ""])
    .join("\n");
}

export function toMcpTextContent<T>(response: ToolResponse<T>, format: ToolResponseFormat = "json"): McpTextContent[] {
  let text: string;
  switch (format) {
    case "markdown":
      text = renderMarkdown(response);
      break;
    case "files":
      text = renderFiles(response);
      break;
    case "patch":
      text = renderPatch(response);
      break;
    case "json":
    default:
      text = JSON.stringify(response, null, 2);
      break;
  }
  return [{ type: "text", text }];
}

export function toMcpStructuredContent<T>(
  response: ToolResponse<T>,
  format: ToolResponseFormat = "json",
): McpToolResult {
  return {
    content: toMcpTextContent(response, format),
    isError: !response.success,
    ...(response.data !== undefined ? { structuredContent: response.data } : {}),
  };
}
