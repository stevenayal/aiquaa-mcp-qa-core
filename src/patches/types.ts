export type FileChangeOperation = "create" | "update" | "delete" | "keep";

export interface FileChange {
  path: string;
  operation: FileChangeOperation;
  previousContent?: string;
  nextContent?: string;
  reason: string;
}

export type FilePatchOperation = "create" | "update" | "delete";

export interface FilePatch {
  path: string;
  unifiedDiff: string;
  operation: FilePatchOperation;
}

export interface PatchSummary {
  created: string[];
  updated: string[];
  deleted: string[];
  kept: string[];
}
