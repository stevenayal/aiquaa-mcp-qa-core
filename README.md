# @aiquaa/mcp-qa-core

Reusable hexagonal-architecture core shared by AIQUAA's QA MCP servers ([`aiquaa-playwright-mcp-server`](https://github.com/stevenayal/aiquaa-playwright-mcp-server), `aiquaa-api-quality-mcp-server`, `aiquaa-performance-mcp-server`, and future Hurl/Pact/k6/Selenium/Appium/REST Assured MCPs).

It centralizes the parts of an AIQUAA QA MCP server that have nothing to do with a specific testing tool: requirement normalization, traceability, coverage aggregation, change planning, patch generation, security policies, and adapters for GitHub, AIQUAA, CodeGraph, and Engram. It never imports Playwright, Postman, Newman, JMeter, Hurl, k6, Selenium, or Appium.

## Purpose and boundaries

**The core does**: normalize requirements and acceptance criteria; model business rules; build and query a requirement→evidence traceability graph; aggregate coverage from tool-specific evaluators; plan changes (create/extend/modify/keep/deprecate/delete/block) under safety rules; generate/validate/apply unified diffs; scan for secrets and enforce path/write/execution/host policies; talk to GitHub, AIQUAA, CodeGraph, and Engram through ports; and shape MCP tool responses consistently.

**The core does not**: generate Playwright specs or Gherkin, build Postman collections, run Newman or JMeter, open a browser, interpret locators, compute JTL percentiles, or generate JMX XML. Those stay in the consumer MCP, wired in through the [`QaToolPlugin`](#plugin-contract) contract.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the layer breakdown and [MIGRATION.md](MIGRATION.md) for the inventory of what moved out of `aiquaa-playwright-mcp-server` and why.

## Install

```bash
npm install @aiquaa/mcp-qa-core zod
```

Node.js 20+ required. The package is ESM-only, tree-shakeable, side-effect-free on import, and ships subpath exports so you never need to reach into `dist/`:

```typescript
import { createQaCore } from "@aiquaa/mcp-qa-core";
import { CoverageEngine } from "@aiquaa/mcp-qa-core/coverage";
import { TraceabilityEngine } from "@aiquaa/mcp-qa-core/traceability";
import { ChangePlanner } from "@aiquaa/mcp-qa-core/changes";
import { generateUnifiedDiff, PatchValidator } from "@aiquaa/mcp-qa-core/patches";
import { LocalGitRepositoryAdapter } from "@aiquaa/mcp-qa-core/repository";
import { OctokitPullRequestAdapter, GitHubRepositoryAdapter } from "@aiquaa/mcp-qa-core/github";
import { HttpAiquaaAdapter } from "@aiquaa/mcp-qa-core/aiquaa";
import { CodeGraphCliAdapter } from "@aiquaa/mcp-qa-core/codegraph";
import { EngramCliAdapter } from "@aiquaa/mcp-qa-core/memory";
import { SecretScanner, PathPolicy } from "@aiquaa/mcp-qa-core/security";
import { createToolSuccess, toMcpStructuredContent } from "@aiquaa/mcp-qa-core/mcp";
import { createQaCoreTestHarness } from "@aiquaa/mcp-qa-core/testing";
```

## Quick start

```typescript
import { createQaCore, createDefaultConfig } from "@aiquaa/mcp-qa-core";

const qaCore = createQaCore({ config: createDefaultConfig() });

const [requirement] = qaCore.requirements.normalize([
  { externalId: "REQ-42", title: "Login", description: "User can log in with email and password." },
]);

const context = qaCore.createContext({ operationId: "generate-123", dryRun: true });
```

## Plugin contract

Every consumer MCP implements `QaToolPlugin<TInput, TAnalysis, TArtifact>` — the seam that keeps tool-specific logic out of the core:

```typescript
import type { QaToolPlugin, CoverageReport, ChangePlan } from "@aiquaa/mcp-qa-core";

export const examplePlugin: QaToolPlugin<ExampleInput, ExampleAnalysis, ExampleArtifact> = {
  name: "example",
  version: "1.0.0",

  canHandle(input) {
    return input.type === "example";
  },

  async analyze(input, context) {
    return { source: input, findings: [] };
  },

  async evaluateCoverage(analysis, context): Promise<CoverageReport> {
    return { items: [], summary: { total: 0, covered: 0, partiallyCovered: 0, uncovered: 0, blocked: 0, outdated: 0, percentage: 0 } };
  },

  async planChanges(analysis, coverage, context): Promise<ChangePlan> {
    return { strategy: "keep", changes: [], assumptions: [], warnings: [], blockedReasons: [] };
  },

  async generateArtifacts() {
    return [];
  },
};

const result = await qaCore.runPlugin(examplePlugin, input);
// result.analysis, result.coverage, result.changePlan, result.artifacts
```

See [MIGRATION.md](MIGRATION.md#2-worked-example-a-qatoolplugin-for-playwright) for a full Playwright-shaped example.

## Coverage

The core never decides what "covered" means for a specific tool — it aggregates evaluators you supply:

```typescript
import { CoverageEngine } from "@aiquaa/mcp-qa-core/coverage";

const engine = new CoverageEngine([myToolSpecificEvaluator]);
const report = await engine.evaluate(myContext);
// report.summary.percentage, report.items[]
```

## Traceability

```typescript
import { TraceabilityEngine } from "@aiquaa/mcp-qa-core/traceability";

const engine = new TraceabilityEngine();
const graph = engine.build({ requirements, scenarios, artifacts, executionResults, evidence });

engine.findUncoveredCriteria(graph, allCriteria);
engine.findOrphanArtifacts(graph, allArtifacts);
engine.findBrokenLinks(graph, { requirement: new Set(requirementIds) });
```

## Change planning and patches

```typescript
import { ChangePlanner } from "@aiquaa/mcp-qa-core/changes";
import { PatchGenerator, PatchValidator, PatchApplier } from "@aiquaa/mcp-qa-core/patches";

const plan = new ChangePlanner().plan({
  candidates: [{ targetPath: "tests/login.spec.ts", decision: "create", reason: "covers REQ-42", requirementIds: ["req-42"], businessRuleIds: [], risk: "low" }],
  existingArtifactPaths: [],
  requestedScope: ["tests"],
});
// plan.strategy, plan.changes[].decision ("create" | "block" | …), plan.blockedReasons
```

`ChangePlanner` refuses duplicate artifacts, blind overwrites (`modify`/`delete` without `hasReadExistingContent: true`), out-of-scope paths, unjustified deletes, and changes with no requirement/business-rule evidence — it returns `"block"` instead.

## Repository and pull requests

```typescript
import { GitHubRepositoryAdapter, OctokitPullRequestAdapter, runPullRequestFlow } from "@aiquaa/mcp-qa-core/github";

const pullRequests = new OctokitPullRequestAdapter({ octokit });
const result = await runPullRequestFlow(pullRequests, {
  repository: { owner: "aiquaa", repo: "demo" },
  baseBranch: "main",
  branchName: "feat/login-coverage",
  commitMessage: "test: add login coverage",
  title: "Add login coverage",
  body: "Generated by the QA MCP.",
  files: changePlanFiles,
  // dryRun and draft both default to true — nothing is written until you opt out.
});
```

## Security

```typescript
import { SecretScanner, PathPolicy, RepositoryWritePolicy } from "@aiquaa/mcp-qa-core/security";

const scanner = new SecretScanner();
scanner.scanText(fileContent); // → SecretFinding[], never the full secret value

const pathPolicy = new PathPolicy({ allowedRoots: [projectRoot] });
pathPolicy.assertSafe(candidatePath); // throws UnsafePathError on traversal, .git, node_modules, or escape
```

`RepositoryWritePolicy`, `ExecutionPolicy`, and `HostPolicy` apply the same "explicit and bounded" default to repository writes, external process execution, and outbound HTTP calls respectively.

## Testing utilities

```typescript
import { createQaCoreTestHarness } from "@aiquaa/mcp-qa-core/testing";

const harness = createQaCoreTestHarness({ files: { "src/controller.ts": "..." } });
const result = await harness.runPlugin(myPlugin, input);

expect(result.changePlan.strategy).toBe("extend");
expect(harness.pullRequests.commits).toHaveLength(0); // dryRun by default
```

The harness wires `InMemoryFileSystemAdapter`, `InMemoryRepositoryAdapter`, `InMemoryPullRequestAdapter`, `InMemoryAiquaaAdapter`, `InMemoryProjectMemoryAdapter`, and `TestLoggerAdapter` into a real `QaCore` — no network, no disk, no external process.

## MCP responses

```typescript
import { createToolSuccess, toMcpStructuredContent } from "@aiquaa/mcp-qa-core/mcp";

const response = createToolSuccess({ operationId: context.operationId, summary: "Generated 3 artifacts", data: artifacts });
return toMcpStructuredContent(response, "files"); // { content: [...], isError: false, structuredContent: artifacts }
```

## Configuration

```typescript
import { loadConfigFromEnvironment, validateConfig } from "@aiquaa/mcp-qa-core";

const config = loadConfigFromEnvironment(process.env);
const validated = validateConfig(config); // Result<QaCoreConfig, ConfigurationError>
```

Recognized environment variables: `GITHUB_TOKEN`, `GITHUB_API_URL`, `AIQUAA_API_BASE_URL`, `AIQUAA_ACCESS_TOKEN`, `CODEGRAPH_BIN`, `CODEGRAPH_ALLOWED_ROOTS`, `ENGRAM_BIN`, `ENGRAM_PROJECT_PREFIX`, `QA_CORE_ALLOWED_ROOTS`, `QA_CORE_MAX_FILE_SIZE`, `QA_CORE_LOG_LEVEL`, `QA_CORE_DRY_RUN`. Domain and application code never reads `process.env` directly — only `loadConfigFromEnvironment` does, and only when you call it.

## Development

```bash
npm install
npm run check   # typecheck + lint + test:coverage + build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow and [SECURITY.md](SECURITY.md) for the vulnerability-reporting process.

## License

MIT — see [LICENSE](LICENSE).
