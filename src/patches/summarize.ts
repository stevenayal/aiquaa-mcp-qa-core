import type { FileChange, PatchSummary } from "./types.js";

export function summarizePatch(changes: FileChange[]): PatchSummary {
  const summary: PatchSummary = { created: [], updated: [], deleted: [], kept: [] };
  for (const change of changes) {
    if (change.operation === "create") summary.created.push(change.path);
    else if (change.operation === "update") summary.updated.push(change.path);
    else if (change.operation === "delete") summary.deleted.push(change.path);
    else summary.kept.push(change.path);
  }
  return summary;
}

/** Deletions the caller did not explicitly request — a strong signal of an unsafe/over-broad patch. */
export function detectUnexpectedDeletions(changes: FileChange[], expectedDeletions: string[]): FileChange[] {
  const expected = new Set(expectedDeletions);
  return changes.filter((change) => change.operation === "delete" && !expected.has(change.path));
}

/** Changes whose path falls outside every declared scope prefix. */
export function detectOutOfScopeChanges(changes: FileChange[], scope: string[]): FileChange[] {
  if (scope.length === 0) return [];
  return changes.filter(
    (change) => !scope.some((scoped) => change.path === scoped || change.path.startsWith(`${scoped}/`)),
  );
}
