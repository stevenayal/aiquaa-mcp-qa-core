import { createDefaultConfig } from "../config/default-config.js";
import { mergeConfig } from "../config/merge-config.js";
import type { QaCoreConfig } from "../config/types.js";
import { createQaCore } from "../core/create-qa-core.js";
import type { QaCore, CreateContextOptions } from "../core/create-qa-core.js";
import type { PluginRunResult, QaToolPlugin } from "../core/plugin.js";
import { InMemoryFileSystemAdapter } from "./in-memory-filesystem.adapter.js";
import { InMemoryRepositoryAdapter } from "./in-memory-repository.adapter.js";
import { InMemoryPullRequestAdapter } from "./in-memory-pull-request.adapter.js";
import { InMemoryAiquaaAdapter } from "../infrastructure/aiquaa/in-memory-aiquaa.adapter.js";
import { InMemoryProjectMemoryAdapter } from "../infrastructure/engram/in-memory-project-memory.adapter.js";
import { TestLoggerAdapter } from "./test-logger.adapter.js";

export interface QaCoreTestHarnessOptions {
  files?: Record<string, string>;
  config?: Partial<QaCoreConfig>;
}

export interface QaCoreTestHarness {
  qaCore: QaCore;
  fs: InMemoryFileSystemAdapter;
  repository: InMemoryRepositoryAdapter;
  pullRequests: InMemoryPullRequestAdapter;
  aiquaa: InMemoryAiquaaAdapter;
  memory: InMemoryProjectMemoryAdapter;
  logger: TestLoggerAdapter;
  runPlugin<TInput, TAnalysis, TArtifact>(
    plugin: QaToolPlugin<TInput, TAnalysis, TArtifact>,
    input: TInput,
    contextOptions?: CreateContextOptions,
  ): Promise<PluginRunResult<TAnalysis, TArtifact>>;
}

/** Wires every in-memory adapter + a real QaCore together for fast, offline plugin tests. */
export function createQaCoreTestHarness(options: QaCoreTestHarnessOptions = {}): QaCoreTestHarness {
  const fs = new InMemoryFileSystemAdapter(options.files);
  const repository = new InMemoryRepositoryAdapter({ files: options.files });
  const pullRequests = new InMemoryPullRequestAdapter();
  const aiquaa = new InMemoryAiquaaAdapter();
  const memory = new InMemoryProjectMemoryAdapter();
  const logger = new TestLoggerAdapter();

  const config = mergeConfig(createDefaultConfig(), options.config ?? {});
  const qaCore = createQaCore({ config, logger, repository, pullRequests, aiquaa, memory });

  return {
    qaCore,
    fs,
    repository,
    pullRequests,
    aiquaa,
    memory,
    logger,
    runPlugin: (plugin, input, contextOptions) => qaCore.runPlugin(plugin, input, contextOptions),
  };
}
