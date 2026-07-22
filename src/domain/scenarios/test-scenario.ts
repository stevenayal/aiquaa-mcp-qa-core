import type { SourceReference } from "../source-reference.js";

export type TestScenarioType =
  | "positive"
  | "negative"
  | "boundary"
  | "security"
  | "performance"
  | "accessibility"
  | "integration"
  | "regression"
  | "smoke";

export interface TestScenario {
  id: string;
  name: string;
  description?: string;
  type: TestScenarioType;
  requirementIds: string[];
  acceptanceCriterionIds: string[];
  businessRuleIds: string[];
  artifactIds: string[];
  sourceReferences: SourceReference[];
}
