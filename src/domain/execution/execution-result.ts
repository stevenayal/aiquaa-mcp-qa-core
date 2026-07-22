import type { SourceReference } from "../source-reference.js";

export type ExecutionStatus = "passed" | "failed" | "skipped" | "blocked" | "error" | "unknown";

export interface ExecutionResult {
  id: string;
  scenarioId: string;
  artifactId?: string;
  status: ExecutionStatus;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  sourceReferences: SourceReference[];
}
