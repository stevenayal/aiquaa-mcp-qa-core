import { generateUnifiedDiff } from "./unified-diff.js";
import type { FileChange, FilePatch, FilePatchOperation } from "./types.js";

export class PatchGenerator {
  generate(change: FileChange): FilePatch | undefined {
    if (change.operation === "keep") return undefined;

    const operation: FilePatchOperation = change.operation;
    const unifiedDiff = generateUnifiedDiff(change.path, change.previousContent, change.nextContent);
    return { path: change.path, unifiedDiff, operation };
  }

  generateAll(changes: FileChange[]): FilePatch[] {
    return changes
      .map((change) => this.generate(change))
      .filter((patch): patch is FilePatch => patch !== undefined);
  }
}
