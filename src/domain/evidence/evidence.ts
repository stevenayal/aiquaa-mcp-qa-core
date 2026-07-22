import type { SourceReference } from "../source-reference.js";

export type EvidenceKind =
  | "execution_log"
  | "screenshot"
  | "report"
  | "coverage_snapshot"
  | "pull_request"
  | "manual_note";

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  title: string;
  summary: string;
  relatedEntityType: string;
  relatedEntityId: string;
  createdAt: string;
  sourceReferences: SourceReference[];
}
