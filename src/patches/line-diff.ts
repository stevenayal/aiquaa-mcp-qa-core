export type DiffOpType = "equal" | "add" | "remove";

export interface DiffOp {
  type: DiffOpType;
  value: string;
}

/** Splits text into lines, preserving each line's own terminator so it round-trips exactly. */
export function splitLinesKeepEnds(text: string): string[] {
  if (text === "") return [];
  const matches = text.match(/[^\n]*\n|[^\n]+$/g);
  return matches ?? [];
}

/** Classic LCS-based line diff. O(n*m) — adequate for source-file-sized inputs. */
export function diffLines(oldText: string, newText: string): DiffOp[] {
  const a = splitLinesKeepEnds(oldText);
  const b = splitLinesKeepEnds(newText);
  const n = a.length;
  const m = b.length;

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", value: a[i]! });
      i += 1;
      j += 1;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      ops.push({ type: "remove", value: a[i]! });
      i += 1;
    } else {
      ops.push({ type: "add", value: b[j]! });
      j += 1;
    }
  }
  while (i < n) {
    ops.push({ type: "remove", value: a[i]! });
    i += 1;
  }
  while (j < m) {
    ops.push({ type: "add", value: b[j]! });
    j += 1;
  }
  return ops;
}
