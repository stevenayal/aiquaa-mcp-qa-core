import { generateOperationId } from "../utils/ids.js";
import { ValidationError } from "../errors/index.js";
import { NoopLoggerAdapter } from "../infrastructure/logging/noop-logger.adapter.js";
import type { QaCoreConfig } from "../config/types.js";
import type { LoggerPort } from "../ports/logger.port.js";
import type { RepositoryPort } from "../ports/repository.port.js";
import type { PullRequestPort } from "../ports/pull-request.port.js";
import type { AiquaaPort } from "../ports/aiquaa.port.js";
import type { CodeContextPort } from "../ports/code-context.port.js";
import type { ProjectMemoryPort } from "../ports/memory.port.js";
import { normalizeRequirements, type RawRequirement } from "../application/requirements/normalize-requirements.js";
import type { Requirement } from "../domain/requirements/requirement.js";
import { TraceabilityEngine } from "../application/traceability/traceability-engine.js";
import { CoverageEngine } from "../application/coverage/coverage-engine.js";
import type { CoverageEvaluator, CoverageReport } from "../domain/coverage/types.js";
import { ChangePlanner } from "../application/changes/change-planner.js";
import type { ChangePlan, ChangePlanInput } from "../domain/changes/types.js";
import { PatchGenerator, PatchValidator, PatchApplier } from "../patches/index.js";
import { PathPolicy } from "../security/path-policy.js";
import type { QaCoreContext } from "./qa-core-context.js";
import type { PluginRunResult, QaToolPlugin } from "./plugin.js";

export interface CreateQaCoreOptions {
  config: QaCoreConfig;
  logger?: LoggerPort;
  repository?: RepositoryPort;
  pullRequests?: PullRequestPort;
  aiquaa?: AiquaaPort;
  codeContext?: CodeContextPort;
  memory?: ProjectMemoryPort;
}

export interface CreateContextOptions {
  operationId?: string;
  dryRun?: boolean;
}

export interface QaCore {
  config: QaCoreConfig;
  logger: LoggerPort;
  requirements: {
    normalize(rawRequirements: RawRequirement[]): Requirement[];
  };
  traceability: TraceabilityEngine;
  coverage: {
    evaluate<TContext>(context: TContext, evaluators: CoverageEvaluator<TContext>[]): Promise<CoverageReport>;
  };
  changes: {
    plan(input: ChangePlanInput): ChangePlan;
  };
  patches: {
    generator: PatchGenerator;
    validator: PatchValidator;
    applier: PatchApplier;
  };
  createContext(options?: CreateContextOptions): QaCoreContext;
  runPlugin<TInput, TAnalysis, TArtifact>(
    plugin: QaToolPlugin<TInput, TAnalysis, TArtifact>,
    input: TInput,
    contextOptions?: CreateContextOptions,
  ): Promise<PluginRunResult<TAnalysis, TArtifact>>;
}

/** Composes the core's engines and injected ports into a single façade for a consumer MCP. */
export function createQaCore(options: CreateQaCoreOptions): QaCore {
  const logger = options.logger ?? new NoopLoggerAdapter();
  const traceability = new TraceabilityEngine();
  const changePlanner = new ChangePlanner();
  const pathPolicy = new PathPolicy({
    allowedRoots: options.config.security.allowedRoots.length > 0 ? options.config.security.allowedRoots : ["."],
  });
  const patches = {
    generator: new PatchGenerator(),
    validator: new PatchValidator({ pathPolicy }),
    applier: new PatchApplier(),
  };

  function createContext(contextOptions: CreateContextOptions = {}): QaCoreContext {
    return {
      config: options.config,
      logger,
      ...(options.repository ? { repository: options.repository } : {}),
      ...(options.pullRequests ? { pullRequests: options.pullRequests } : {}),
      ...(options.aiquaa ? { aiquaa: options.aiquaa } : {}),
      ...(options.codeContext ? { codeContext: options.codeContext } : {}),
      ...(options.memory ? { memory: options.memory } : {}),
      operationId: contextOptions.operationId ?? generateOperationId(),
      dryRun: contextOptions.dryRun ?? options.config.security.dryRun,
    };
  }

  return {
    config: options.config,
    logger,
    requirements: { normalize: normalizeRequirements },
    traceability,
    coverage: {
      async evaluate<TContext>(context: TContext, evaluators: CoverageEvaluator<TContext>[]): Promise<CoverageReport> {
        const engine = new CoverageEngine(evaluators);
        return engine.evaluate(context);
      },
    },
    changes: {
      plan(input: ChangePlanInput): ChangePlan {
        return changePlanner.plan(input);
      },
    },
    patches,
    createContext,
    async runPlugin(plugin, input, contextOptions) {
      const context = createContext(contextOptions);
      if (!plugin.canHandle(input)) {
        throw new ValidationError(`Plugin "${plugin.name}" (v${plugin.version}) cannot handle the given input.`);
      }
      logger.info(`Running plugin "${plugin.name}"`, { operationId: context.operationId });
      const analysis = await plugin.analyze(input, context);
      const coverage = await plugin.evaluateCoverage(analysis, context);
      const changePlan = await plugin.planChanges(analysis, coverage, context);
      const artifacts = await plugin.generateArtifacts(changePlan, context);
      return { analysis, coverage, changePlan, artifacts };
    },
  };
}
