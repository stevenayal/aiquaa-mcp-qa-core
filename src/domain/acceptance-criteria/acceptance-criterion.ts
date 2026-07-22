import type { SourceReference } from "../source-reference.js";

export interface AcceptanceCriterion {
  id: string;
  requirementId: string;
  description: string;
  expectedOutcome?: string;
  preconditions: string[];
  tags: string[];
  sourceReferences: SourceReference[];
}
