import { generateAcceptanceCriterionId, generateRequirementId } from "../../utils/ids.js";
import type { SourceReference } from "../../domain/source-reference.js";
import type { AcceptanceCriterion } from "../../domain/acceptance-criteria/acceptance-criterion.js";
import type { Requirement, RequirementType, Priority } from "../../domain/requirements/requirement.js";

export interface RawAcceptanceCriterion {
  id?: string;
  description: string;
  expectedOutcome?: string;
  preconditions?: string[];
  tags?: string[];
  sourceReferences?: SourceReference[];
}

export interface RawRequirement {
  id?: string;
  externalId?: string;
  title: string;
  description: string;
  type?: RequirementType;
  priority?: Priority;
  acceptanceCriteria?: RawAcceptanceCriterion[];
  businessRuleIds?: string[];
  tags?: string[];
  sourceReferences?: SourceReference[];
}

/**
 * Turns loosely-shaped input (from AIQUAA, user text, or a plugin) into the
 * stable Requirement/AcceptanceCriterion domain model with deterministic ids.
 */
export function normalizeRequirements(rawRequirements: RawRequirement[]): Requirement[] {
  return rawRequirements.map((raw) => normalizeRequirement(raw));
}

export function normalizeRequirement(raw: RawRequirement): Requirement {
  const requirementId =
    raw.id ??
    generateRequirementId({
      externalId: raw.externalId,
      seed: `${raw.title}\n${raw.description}`,
    });

  const acceptanceCriteria: AcceptanceCriterion[] = (raw.acceptanceCriteria ?? []).map((criterion) =>
    normalizeAcceptanceCriterion(criterion, requirementId),
  );

  return {
    id: requirementId,
    ...(raw.externalId ? { externalId: raw.externalId } : {}),
    title: raw.title.trim(),
    description: raw.description.trim(),
    type: raw.type ?? "functional",
    ...(raw.priority ? { priority: raw.priority } : {}),
    acceptanceCriteria,
    businessRuleIds: raw.businessRuleIds ?? [],
    tags: raw.tags ?? [],
    sourceReferences: raw.sourceReferences ?? [],
  };
}

export function normalizeAcceptanceCriterion(
  raw: RawAcceptanceCriterion,
  requirementId: string,
): AcceptanceCriterion {
  const id = raw.id ?? generateAcceptanceCriterionId({ seed: `${requirementId}\n${raw.description}` });
  return {
    id,
    requirementId,
    description: raw.description.trim(),
    ...(raw.expectedOutcome ? { expectedOutcome: raw.expectedOutcome } : {}),
    preconditions: raw.preconditions ?? [],
    tags: raw.tags ?? [],
    sourceReferences: raw.sourceReferences ?? [],
  };
}
