export type SourceKind =
  | "requirement"
  | "acceptance_criteria"
  | "business_rule"
  | "openapi"
  | "source_code"
  | "controller"
  | "service"
  | "validator"
  | "dto"
  | "schema"
  | "existing_test"
  | "execution_result"
  | "repository"
  | "user_input"
  | "aiquaa"
  | "codegraph"
  | "engram"
  | "estimated";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface SourceReference {
  kind: SourceKind;
  path?: string;
  repository?: string;
  branch?: string;
  commitSha?: string;
  lineStart?: number;
  lineEnd?: number;
  identifier?: string;
  description?: string;
  confidence: ConfidenceLevel;
}
