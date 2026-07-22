import type { SourceReference } from "../source-reference.js";

export type TraceableEntityType =
  | "requirement"
  | "acceptance_criterion"
  | "business_rule"
  | "test_scenario"
  | "automation_artifact"
  | "execution_result"
  | "evidence";

export type TraceabilityRelation =
  | "verifies"
  | "implements"
  | "covers"
  | "depends_on"
  | "derived_from"
  | "executed_by"
  | "produced";

export interface TraceabilityLink {
  fromType: TraceableEntityType;
  fromId: string;
  toType: TraceableEntityType;
  toId: string;
  relation: TraceabilityRelation;
  sourceReferences: SourceReference[];
}

export interface TraceabilityGraph {
  links: TraceabilityLink[];
}
