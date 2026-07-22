# Architecture

`@aiquaa/mcp-qa-core` is a hexagonal-architecture core: **domain** (pure models + rules), **application** (engines that orchestrate the domain), **ports** (interfaces the core depends on), **infrastructure** (adapters that implement ports against real systems), plus cross-cutting **security**, **config**, **errors**, **result**, and **mcp** (response shaping) modules.

```
src/
├── domain/           pure data models + domain-only logic (no I/O)
│   ├── requirements, acceptance-criteria, business-rules,
│   │   scenarios, artifacts, execution, evidence   → entity types
│   ├── traceability   → graph types
│   ├── coverage       → coverage types + evaluator contract
│   └── changes        → change-plan types
├── application/       engines that orchestrate domain + ports
│   ├── requirements    (normalize-requirements)
│   ├── traceability    (TraceabilityEngine)
│   ├── coverage        (CoverageEngine)
│   └── changes          (ChangePlanner)
├── ports/             interfaces only — no implementation
├── infrastructure/    adapters implementing ports
│   ├── filesystem, git, github, aiquaa, codegraph, engram, logging, process
├── patches/           diff/validate/apply/summarize file changes
├── security/          SecretScanner, PathPolicy, RepositoryWritePolicy, …
├── config/            typed config + env loader (the only place env vars are read)
├── errors/            QaCoreError hierarchy
├── result/            Result<T, E> helpers
├── mcp/               ToolResponse + MCP content formatting
├── core/              createQaCore(), QaCoreContext, QaToolPlugin contract
├── schemas/           Zod schemas mirroring the domain types
└── testing/           in-memory adapters + createQaCoreTestHarness
```

## Dependency direction

```
infrastructure ──implements──> ports <──depends on── application ──depends on── domain
                                                          ^
                                                          |
                                                        core (composition root)
```

- **domain** depends on nothing else in the package (no I/O, no env, no adapters).
- **application** depends on `domain` and `ports` (interfaces), never on `infrastructure`.
- **infrastructure** depends on `ports` (implements them) and on external SDKs (`@octokit/rest`, `node:child_process`, `node:fs`) — never on `application`.
- **core** (`createQaCore`) is the only place that wires a concrete `infrastructure` adapter to an `application` engine, via dependency injection. A consumer MCP is free to swap any adapter (e.g. `HttpAiquaaAdapter` → `InMemoryAiquaaAdapter` in tests) without touching `application` or `domain`.

This is what lets the same `CoverageEngine` serve Playwright, Postman/Newman, and JMeter: it never imports a concrete tool. Tool-specific judgment enters only through `CoverageEvaluator<TContext>` implementations that each consumer MCP owns.

## Why a `QaToolPlugin` and not a bigger core

The temptation with a shared core is to keep pulling tool-specific logic "up" until the core becomes a kitchen-sink. `QaToolPlugin<TInput, TAnalysis, TArtifact>` (in `core/plugin.ts`) is the seam that stops that: `analyze`, `evaluateCoverage`, `planChanges`, and `generateArtifacts` are all owned by the consumer MCP. The core's `runPlugin()` just sequences them and hands each one a `QaCoreContext` (config, logger, and the injected ports). See [MIGRATION.md](MIGRATION.md) for a worked Playwright example.

## Security is not optional

Every path-touching operation goes through `PathPolicy` (rejects traversal, `.git`, `node_modules`, and anything outside `allowedRoots`). Every repository write goes through `RepositoryWritePolicy` (requires explicit scope + file list, scans for secrets, defaults `dryRun` to `true`). Every external process invocation goes through `ExecutionPolicy` (allow-listed commands, enforced timeout). These are composed inside `createQaCore()` and inside the individual adapters — a consumer MCP does not need to remember to call them separately for the paths the core already owns (e.g. `LocalFileSystemAdapter`, `PatchValidator`).

## Errors and results

Domain/application code prefers `Result<T, E extends QaCoreError>` over throwing for expected failure modes (validation, blocked operations). Infrastructure adapters throw typed `QaCoreError` subclasses (`GitHubIntegrationError`, `AiquaaIntegrationError`, `ExternalProcessError`, `TimeoutError`, …) because I/O failure is exceptional, not a control-flow branch. `mcp/tool-response.ts` converts either shape into the same `ToolResponse` envelope, so a consumer MCP's tool handler has exactly one place to catch and format errors.

## No side effects on import

No module in this package opens a file, spawns a process, or makes a network call at import time. Every adapter takes its configuration through its constructor and only touches the outside world when a method is called. This is what makes the package tree-shakeable and safe to import from a script that never intends to use, say, the GitHub adapter.
