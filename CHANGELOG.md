# Changelog

All notable changes to this project are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-07-21

Initial release.

### Added

- Domain model: `SourceReference`, `Requirement`, `AcceptanceCriterion`, `BusinessRule`, `TestScenario`, `AutomationArtifact`, `ExecutionResult`, `Evidence`.
- Requirements normalization with deterministic id generation (`generateRequirementId`, `generateAcceptanceCriterionId`, `generateBusinessRuleId`, `generateScenarioId`, `generateArtifactId`, `generateOperationId`).
- `TraceabilityEngine`: builds and queries a requirement→evidence graph (`findCoverageForRequirement`, `findArtifactsForRule`, `findOrphanArtifacts`, `findUncoveredCriteria`, `findBrokenLinks`, `mergeTraceabilityGraphs`).
- `CoverageEngine`: aggregates tool-agnostic `CoverageEvaluator<TContext>` implementations into a `CoverageReport`.
- `ChangePlanner`: turns proposed changes into a safe `ChangePlan`, blocking duplicates, blind overwrites, out-of-scope writes, unjustified deletes, and unevidenced changes.
- Patch pipeline: `generateUnifiedDiff`/`applyUnifiedDiff` (LCS-based line diff), `PatchGenerator`, `PatchValidator`, `PatchApplier`, `summarizePatch`, `detectUnexpectedDeletions`, `detectOutOfScopeChanges`.
- Security module: `SecretScanner`, `PathPolicy`, `RepositoryWritePolicy`, `ExecutionPolicy`, `HostPolicy`, `RedactionService`, `InputSanitizer`.
- Ports: `FileSystemPort`, `RepositoryPort`, `PullRequestPort`, `AiquaaPort`, `CodeContextPort`, `ProjectMemoryPort`, `LoggerPort`.
- Adapters: `LocalFileSystemAdapter`, `LocalGitRepositoryAdapter`, `GitHubRepositoryAdapter`, `OctokitPullRequestAdapter` (+ `runPullRequestFlow`), `HttpAiquaaAdapter`, `CodeGraphCliAdapter`, `EngramCliAdapter`, `ConsoleLoggerAdapter`, and Noop/InMemory counterparts for every port.
- MCP response helpers: `createToolSuccess`, `createToolFailure`, `serializeToolResponse`, `toMcpTextContent`, `toMcpStructuredContent` (json/markdown/files/patch formats).
- Typed configuration: `QaCoreConfig`, `loadConfigFromEnvironment`, `validateConfig`, `mergeConfig`, `createDefaultConfig`.
- `QaCoreError` hierarchy with safe JSON serialization and a `Result<T, E>` type for non-exceptional error flows.
- Plugin system: `QaToolPlugin<TInput, TAnalysis, TArtifact>`, `QaCoreContext`, `createQaCore()`.
- Testing utilities: `createQaCoreTestHarness` plus every in-memory adapter, usable standalone.
- Subpath exports for `requirements`, `coverage`, `traceability`, `changes`, `patches`, `repository`, `github`, `aiquaa`, `codegraph`, `memory`, `security`, `mcp`, `testing`.

[Unreleased]: https://github.com/stevenayal/aiquaa-mcp-qa-core/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/stevenayal/aiquaa-mcp-qa-core/releases/tag/v0.1.0
