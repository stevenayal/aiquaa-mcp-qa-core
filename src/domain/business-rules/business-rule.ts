import type { SourceReference } from "../source-reference.js";
import type { Priority } from "../requirements/requirement.js";

export interface BusinessRule {
  id: string;
  externalId?: string;
  title: string;
  description: string;
  category?: string;
  severity?: Priority;
  sourceReferences: SourceReference[];
}
