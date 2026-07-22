# Migration guide

This document covers two things:

1. **How `aiquaa-playwright-mcp-server` (the reference implementation) maps onto `@aiquaa/mcp-qa-core`** — the inventory, the `MOVE / GENERALIZE / KEEP / REWRITE / REMOVE` classification, and a worked example of the resulting plugin.
2. **The phased plan** for adopting the core across the AIQUAA MCP fleet without a big-bang rewrite.

## 1. Inventory of `aiquaa-playwright-mcp-server`

Inspected at [github.com/stevenayal/aiquaa-playwright-mcp-server](https://github.com/stevenayal/aiquaa-playwright-mcp-server) (v0.2.1). The codebase is small and already fairly clean — most of the "extraction" work is generalization, not untangling.

| Component | Responsibility | Classification | Destination in core | Changes needed | Risk |
|---|---|---|---|---|---|
| `constants.ts` → `AIQUAA_ENDPOINTS` | AIQUAA route builders | **GENERALIZE** | `infrastructure/aiquaa/endpoints.ts` | Widen from `businessRules/requirement/feature` to `project/requirement/businessRules/coverage/executions/pullRequestLinks` | Low |
| `constants.ts` → `SERVER_NAME/VERSION/PORT/MCP_PATH` | Playwright server bootstrap config | **KEEP** | — | None | — |
| `constants.ts` → `RULE_TAG_PREFIX/RULE_ANNOTATION_TYPE` | `@rule:` tag convention for Playwright/Gherkin | **KEEP** | — | None | — |
| `types.ts` → `BusinessRule`, `PaginatedBusinessRules` | Business rule shape | **GENERALIZE** | `domain/business-rules/BusinessRule` (+ `SourceReference[]`, `severity`) | Playwright MCP maps AIQUAA's paginated response onto the richer core type | Medium (shape change) |
| `types.ts` → `CoverageReport`, `RuleCoverageItem` | Rule-coverage report | **GENERALIZE** | `domain/coverage` (generic `CoverageItem`/`CoverageReport`) | The Playwright-specific judgment ("what counts as covered for a Playwright spec") becomes a `CoverageEvaluator<PlaywrightContext>` that stays in the Playwright MCP | Medium |
| `types.ts` → `NormalizedTestResult`, `TestStatus` | Playwright test result | **GENERALIZE (partial)** | `domain/execution/ExecutionResult` | Map `TestStatus` → `ExecutionStatus`; Playwright-only fields (`feature`, `title`) stay in the MCP's own analysis type | Low |
| `types.ts` → `ScenarioRuleMapping`, `GeneratedFile` | Gherkin↔rule mapping, generated file | **REWRITE** | `AutomationArtifact` + `FileChange` (core) | `GeneratedFile` is replaced by `AutomationArtifact` (`kind: "playwright_spec"`, opaque to the core) and `patches.FileChange` for the actual diff | Medium |
| `services/aiquaa-client.ts` | AIQUAA HTTP client | **GENERALIZE** | `infrastructure/aiquaa/HttpAiquaaAdapter` | Drop the Playwright-only helpers (`getRequirementText`, `getFeatureContent` — text-shape assumptions); the core adapter exposes generic project/requirement/business-rule/coverage/execution/PR-link operations, and the Playwright MCP layers its own text extraction on top | Medium |
| `services/codegraph-client.ts` | CodeGraph CLI client + allowed-roots check | **MOVE** (near 1:1) | `infrastructure/codegraph/CodeGraphCliAdapter` + `infrastructure/process/allowed-roots.ts` | Output changes from raw markdown text to structured `CodeContextResult` (files/symbols/relationships/warnings) | Low |
| `services/engram-client.ts` | Engram CLI client | **MOVE** (near 1:1) | `infrastructure/engram/EngramCliAdapter` | Output becomes structured `MemoryEntry[]`; content is redacted before it is ever written | Low |
| `services/command-runner.ts` | External process execution | **MOVE** | `infrastructure/process/run-command.ts` | Errors become typed (`ExternalProcessError`, `TimeoutError`) instead of raw `Error` | Low |
| `services/coverage-report.ts` | Build the rule-coverage report for Playwright | **REWRITE** | Consume `CoverageEngine` + a `PlaywrightRuleCoverageEvaluator` that stays in the Playwright MCP | The "is this rule covered by this spec" judgment is 100% Playwright domain knowledge — the core only aggregates | High (business logic to extract carefully) |
| `services/scenario-mapper.ts` | Map Gherkin scenarios → rule ids | **KEEP** | — (output reshaped to `TestScenario[]`) | Gherkin parsing itself never moves; only the final shape changes | Medium |
| `services/bdd-generator.ts` | Gherkin generation | **KEEP** | — | None — explicitly out of scope for the core | — |
| `services/gherkin.ts` | Gherkin utilities | **KEEP** | — | None | — |
| `services/playwright-generator.ts` | Playwright/`playwright-bdd` spec generation | **KEEP** | — | Produces `AutomationArtifact[]` instead of `GeneratedFile[]` | Low |
| `services/pdf-text-validator.ts` | PDF text assertion helper | **KEEP** | — | None | — |
| `services/formatters.ts` | Markdown rendering for MCP responses | **GENERALIZE (partial)** | `mcp/formatters.ts` (generic envelope) | Gherkin/Playwright-specific markdown stays in the MCP and is passed as `ToolResponse.data`; the core only standardizes the envelope | Low |
| `extensions/rule-reporter.ts` | Custom Playwright test reporter | **KEEP** | — | None | — |
| `extensions/rule-tags.ts` | `@rule:` tag parsing | **KEEP** | — | None | — |
| `tools/register-tools.ts` | MCP tool registration (`@modelcontextprotocol/sdk`) | **KEEP** | — | Build responses with `createToolSuccess`/`createToolFailure`/`toMcpStructuredContent` instead of hand-rolled objects | Medium |
| `server.ts` / `index.ts` | Server bootstrap (Express + MCP SDK) | **KEEP** | — | Construct one `QaCore` via `createQaCore()` at startup and inject it into tool handlers | Low |
| *(new)* GitHub / PR automation | Did not exist | — | `infrastructure/github/*` | Net-new capability, adopted opportunistically | — |
| *(new)* Traceability / ChangePlanner / Patches | Coverage was ad hoc, no change-planning or diffing existed | — | `domain`/`application` (new) | Adopted incrementally — not required for parity | — |

**REMOVE**: nothing in the current codebase is dead weight. The one thing that *disappears* going forward is duplicated percentage math — `services/coverage-report.ts` computed its own `coveragePercentage`; that becomes `summarizeCoverageItems()` from the core.

### What must never move to the core

Per the core's mandate, these stay in `aiquaa-playwright-mcp-server` permanently:
Gherkin generation, step generation, the Playwright reporter, `@rule:` tags, locator strategy, Playwright auth setup, browser configuration.

## 2. Worked example: a `QaToolPlugin` for Playwright

This is what `services/coverage-report.ts` + `services/scenario-mapper.ts` + `tools/register-tools.ts`'s coverage tool collapse into once the Playwright MCP depends on `@aiquaa/mcp-qa-core`:

```typescript
import type { QaToolPlugin, QaCoreContext, CoverageReport, ChangePlan } from "@aiquaa/mcp-qa-core";
import type { AutomationArtifact } from "@aiquaa/mcp-qa-core";

interface PlaywrightInput {
  type: "playwright";
  projectId: string;
  specFiles: Array<{ path: string; content: string }>;
}

interface PlaywrightAnalysis {
  scenarios: ParsedScenario[]; // Playwright/Gherkin-specific — never enters the core
}

export const playwrightPlugin: QaToolPlugin<PlaywrightInput, PlaywrightAnalysis, AutomationArtifact> = {
  name: "playwright",
  version: "1.0.0",

  canHandle: (input) => input.type === "playwright",

  async analyze(input, context) {
    // Existing Gherkin/tag parsing from scenario-mapper.ts + rule-tags.ts — unchanged.
    return { scenarios: parseSpecFiles(input.specFiles) };
  },

  async evaluateCoverage(analysis, context): Promise<CoverageReport> {
    // The core's CoverageEngine aggregates; this evaluator carries the
    // Playwright-specific "what counts as covered" judgment that used to
    // live in coverage-report.ts.
    const engine = context.config; // (illustrative — engine is built by the plugin, evaluators are Playwright's own)
    return buildPlaywrightCoverageReport(analysis.scenarios);
  },

  async planChanges(analysis, coverage, context): Promise<ChangePlan> {
    // Uses the injected ChangePlanner via context, or qaCore.changes.plan()
    // from the calling MCP — enforces no-duplicate/no-blind-overwrite/scope rules.
    return planPlaywrightChanges(analysis, coverage);
  },

  async generateArtifacts(plan, context): Promise<AutomationArtifact[]> {
    // playwright-generator.ts, unchanged, just returns AutomationArtifact
    // instead of GeneratedFile.
    return generatePlaywrightSpecs(plan);
  },
};
```

`register-tools.ts` then becomes a thin wrapper:

```typescript
const qaCore = createQaCore({ config, logger, repository, pullRequests, aiquaa, memory, codeContext });

server.registerTool("generate_playwright_tests", schema, async (input) => {
  const result = await qaCore.runPlugin(playwrightPlugin, input);
  const response = createToolSuccess({
    operationId: qaCore.createContext().operationId,
    summary: `Generated ${result.artifacts.length} artifact(s)`,
    data: result.artifacts,
  });
  return toMcpStructuredContent(response, "files");
});
```

## 3. Phased migration plan

Each phase must leave `aiquaa-playwright-mcp-server` compiling and its tests green — no big-bang rewrite.

**Phase 1 — Core skeleton** (this repo, done): types, errors, `Result`, config, logging, base security (`SecretScanner`, `PathPolicy`), in-memory adapters.

**Phase 2 — Integrations**: extract `AiquaaClient` → `HttpAiquaaAdapter`, `CodeGraphClient` → `CodeGraphCliAdapter`, `EngramClient` → `EngramCliAdapter`, repository/GitHub ports. *(Done in this repo — ready for consumers.)*

**Phase 3 — Domain engines**: requirements normalization, traceability, coverage, change planning, patches. *(Done in this repo.)*

**Phase 4 — Migrate `aiquaa-playwright-mcp-server`**: add `@aiquaa/mcp-qa-core` as a dependency, wrap its Playwright-specific logic in a `QaToolPlugin` as shown above, replace hand-rolled AIQUAA/CodeGraph/Engram clients with the core adapters, replace ad hoc MCP responses with `createToolSuccess`/`toMcpStructuredContent`. Ship behind the existing test suite; do not change its public MCP tool contract in the same release.

**Phase 5 — Validate `aiquaa-api-quality-mcp-server`**: implement a `QaToolPlugin` whose `AutomationArtifact.kind` values are Postman/Newman-specific (`postman_collection`, `postman_request`); confirm the core's genericity holds for a second, structurally different tool.

**Phase 6 — Validate `aiquaa-performance-mcp-server`**: same exercise for JMeter (`jmeter_plan`, `jmeter_sampler`). If phases 5–6 require any change to the core's public API, it is a sign the API was Playwright-shaped — fix it before `1.0.0`.

Version `0.1.0` ships after phase 3. `1.0.0` ships once phases 4–6 are complete and stable.
