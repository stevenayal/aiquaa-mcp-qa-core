import { diffLines, splitLinesKeepEnds, type DiffOp } from "./line-diff.js";

export interface UnifiedDiffOptions {
  contextLines?: number;
  fromLabel?: string;
  toLabel?: string;
}

const NO_NEWLINE_MARKER = "\\ No newline at end of file";

function stripTerminator(value: string): { text: string; hadNewline: boolean } {
  const match = /\r?\n$/.exec(value);
  if (!match) return { text: value, hadNewline: false };
  return { text: value.slice(0, value.length - match[0].length), hadNewline: true };
}

/** Builds the `@@ … @@` hunk body (no file headers) for a unified diff between two texts. */
export function buildUnifiedDiffBody(oldText: string, newText: string, options: UnifiedDiffOptions = {}): string {
  const context = options.contextLines ?? 3;
  const ops = diffLines(oldText, newText);
  if (ops.every((op) => op.type === "equal")) return "";

  const changeIndices: number[] = [];
  ops.forEach((op, idx) => {
    if (op.type !== "equal") changeIndices.push(idx);
  });
  if (changeIndices.length === 0) return "";

  const clusters: Array<{ start: number; end: number }> = [];
  let clusterStart = changeIndices[0]!;
  let clusterEnd = changeIndices[0]!;
  for (let k = 1; k < changeIndices.length; k += 1) {
    const idx = changeIndices[k]!;
    if (idx - clusterEnd <= context * 2) {
      clusterEnd = idx;
    } else {
      clusters.push({ start: clusterStart, end: clusterEnd });
      clusterStart = idx;
      clusterEnd = idx;
    }
  }
  clusters.push({ start: clusterStart, end: clusterEnd });

  const oldLineAt: number[] = [];
  const newLineAt: number[] = [];
  let oldCount = 0;
  let newCount = 0;
  for (const op of ops) {
    oldLineAt.push(oldCount + 1);
    newLineAt.push(newCount + 1);
    if (op.type === "equal") {
      oldCount += 1;
      newCount += 1;
    } else if (op.type === "remove") {
      oldCount += 1;
    } else {
      newCount += 1;
    }
  }

  const hunkBlocks: string[] = [];
  for (const cluster of clusters) {
    const start = Math.max(0, cluster.start - context);
    const end = Math.min(ops.length - 1, cluster.end + context);
    const hunkOps = ops.slice(start, end + 1);

    const oldStart = oldLineAt[start]!;
    const newStart = newLineAt[start]!;
    let oldLen = 0;
    let newLen = 0;
    const lines: string[] = [];

    hunkOps.forEach((op: DiffOp, offset: number) => {
      const isLastOldLine = op.type !== "add" && isLastOfSide(ops, start + offset, "old");
      const isLastNewLine = op.type !== "remove" && isLastOfSide(ops, start + offset, "new");
      const { text, hadNewline } = stripTerminator(op.value);

      if (op.type === "equal") {
        lines.push(` ${text}`);
        oldLen += 1;
        newLen += 1;
        if (!hadNewline && (isLastOldLine || isLastNewLine)) lines.push(NO_NEWLINE_MARKER);
      } else if (op.type === "remove") {
        lines.push(`-${text}`);
        oldLen += 1;
        if (!hadNewline && isLastOldLine) lines.push(NO_NEWLINE_MARKER);
      } else {
        lines.push(`+${text}`);
        newLen += 1;
        if (!hadNewline && isLastNewLine) lines.push(NO_NEWLINE_MARKER);
      }
    });

    hunkBlocks.push(`@@ -${oldStart},${oldLen} +${newStart},${newLen} @@`);
    hunkBlocks.push(...lines);
  }

  return hunkBlocks.join("\n");
}

function isLastOfSide(ops: DiffOp[], index: number, side: "old" | "new"): boolean {
  for (let i = index + 1; i < ops.length; i += 1) {
    const op = ops[i]!;
    if (side === "old" && op.type !== "add") return false;
    if (side === "new" && op.type !== "remove") return false;
  }
  return true;
}

/** Produces a full `diff -u`-style patch with `--- a/path` / `+++ b/path` headers. */
export function generateUnifiedDiff(
  path: string,
  previousContent: string | undefined,
  nextContent: string | undefined,
  options: UnifiedDiffOptions = {},
): string {
  const fromLabel = options.fromLabel ?? (previousContent === undefined ? "/dev/null" : `a/${path}`);
  const toLabel = options.toLabel ?? (nextContent === undefined ? "/dev/null" : `b/${path}`);
  const body = buildUnifiedDiffBody(previousContent ?? "", nextContent ?? "", options);
  if (!body) return "";
  return [`--- ${fromLabel}`, `+++ ${toLabel}`, body].join("\n");
}

/** Reconstructs the new file content by applying a unified diff body to the original content. */
export function applyUnifiedDiff(originalContent: string, diffText: string): string {
  const originalLines = splitLinesKeepEnds(originalContent);
  const diffTextLines = diffText.split("\n");
  let origIndex = 0;
  const output: string[] = [];
  let i = 0;

  while (i < diffTextLines.length && !diffTextLines[i]!.startsWith("@@")) i += 1;

  while (i < diffTextLines.length) {
    const header = diffTextLines[i]!;
    const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header);
    if (!match) {
      i += 1;
      continue;
    }
    const oldStart = Number.parseInt(match[1]!, 10);
    i += 1;

    while (origIndex < oldStart - 1) {
      output.push(originalLines[origIndex]!);
      origIndex += 1;
    }

    while (i < diffTextLines.length && !diffTextLines[i]!.startsWith("@@")) {
      const line = diffTextLines[i]!;
      const next = diffTextLines[i + 1];
      const noNewline = next === NO_NEWLINE_MARKER;

      if (line.startsWith(" ")) {
        const content = noNewline ? line.slice(1) : `${line.slice(1)}\n`;
        output.push(content);
        origIndex += 1;
        if (noNewline) i += 1;
      } else if (line.startsWith("-")) {
        origIndex += 1;
        if (noNewline) i += 1;
      } else if (line.startsWith("+")) {
        const content = noNewline ? line.slice(1) : `${line.slice(1)}\n`;
        output.push(content);
        if (noNewline) i += 1;
      }
      i += 1;
    }
  }

  while (origIndex < originalLines.length) {
    output.push(originalLines[origIndex]!);
    origIndex += 1;
  }

  return output.join("");
}
