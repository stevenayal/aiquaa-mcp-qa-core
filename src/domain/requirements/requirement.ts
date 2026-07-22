import type { SourceReference } from "../source-reference.js";
import type { AcceptanceCriterion } from "../acceptance-criteria/acceptance-criterion.js";

export type RequirementType =
  | "functional"
  | "non_functional"
  | "security"
  | "performance"
  | "accessibility"
  | "regulatory"
  | "technical";

export type Priority = "critical" | "high" | "medium" | "low";

export interface Requirement {
  id: string;
  externalId?: string;
  title: string;
  description: string;
  type: RequirementType;
  priority?: Priority;
  acceptanceCriteria: AcceptanceCriterion[];
  businessRuleIds: string[];
  tags: string[];
  sourceReferences: SourceReference[];
}
