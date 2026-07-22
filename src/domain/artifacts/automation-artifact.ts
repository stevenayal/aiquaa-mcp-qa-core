import type { SourceReference } from "../source-reference.js";

/**
 * `kind` is intentionally an open string, not a union — the core must never
 * hardcode tool-specific values like "playwright_spec" or "jmeter_sampler".
 * Consumer MCPs own that vocabulary.
 */
export interface AutomationArtifact {
  id: string;
  kind: string;
  name: string;
  path?: string;
  technology?: string;
  scenarioIds: string[];
  metadata: Record<string, unknown>;
  sourceReferences: SourceReference[];
}
