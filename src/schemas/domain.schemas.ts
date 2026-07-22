import { z } from "zod";

export const sourceKindSchema = z.enum([
  "requirement",
  "acceptance_criteria",
  "business_rule",
  "openapi",
  "source_code",
  "controller",
  "service",
  "validator",
  "dto",
  "schema",
  "existing_test",
  "execution_result",
  "repository",
  "user_input",
  "aiquaa",
  "codegraph",
  "engram",
  "estimated",
]);

export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const sourceReferenceSchema = z.object({
  kind: sourceKindSchema,
  path: z.string().optional(),
  repository: z.string().optional(),
  branch: z.string().optional(),
  commitSha: z.string().optional(),
  lineStart: z.number().int().nonnegative().optional(),
  lineEnd: z.number().int().nonnegative().optional(),
  identifier: z.string().optional(),
  description: z.string().optional(),
  confidence: confidenceLevelSchema,
});

export const prioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const acceptanceCriterionSchema = z.object({
  id: z.string().min(1),
  requirementId: z.string().min(1),
  description: z.string().min(1),
  expectedOutcome: z.string().optional(),
  preconditions: z.array(z.string()),
  tags: z.array(z.string()),
  sourceReferences: z.array(sourceReferenceSchema),
});

export const requirementTypeSchema = z.enum([
  "functional",
  "non_functional",
  "security",
  "performance",
  "accessibility",
  "regulatory",
  "technical",
]);

export const requirementSchema = z.object({
  id: z.string().min(1),
  externalId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  type: requirementTypeSchema,
  priority: prioritySchema.optional(),
  acceptanceCriteria: z.array(acceptanceCriterionSchema),
  businessRuleIds: z.array(z.string()),
  tags: z.array(z.string()),
  sourceReferences: z.array(sourceReferenceSchema),
});

export const businessRuleSchema = z.object({
  id: z.string().min(1),
  externalId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  severity: prioritySchema.optional(),
  sourceReferences: z.array(sourceReferenceSchema),
});

export const testScenarioTypeSchema = z.enum([
  "positive",
  "negative",
  "boundary",
  "security",
  "performance",
  "accessibility",
  "integration",
  "regression",
  "smoke",
]);

export const testScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: testScenarioTypeSchema,
  requirementIds: z.array(z.string()),
  acceptanceCriterionIds: z.array(z.string()),
  businessRuleIds: z.array(z.string()),
  artifactIds: z.array(z.string()),
  sourceReferences: z.array(sourceReferenceSchema),
});

export const automationArtifactSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  name: z.string().min(1),
  path: z.string().optional(),
  technology: z.string().optional(),
  scenarioIds: z.array(z.string()),
  metadata: z.record(z.unknown()),
  sourceReferences: z.array(sourceReferenceSchema),
});
