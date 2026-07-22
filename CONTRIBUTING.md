# Contributing

## Setup

```bash
npm install
npm run check   # typecheck + lint + test:coverage + build
```

Individual scripts: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:coverage`, `npm run build`.

## Ground rules

- **No dependency on a specific QA tool.** Nothing in `src/` may import `playwright`, `@playwright/test`, `newman`, `postman-collection`, or similar — `.eslintrc.cjs` enforces the obvious ones via `no-restricted-imports`, but the real test is: could `aiquaa-performance-mcp-server` and `aiquaa-playwright-mcp-server` both depend on this change without either one needing to know the other exists? If not, it belongs in a consumer MCP, not here.
- **Hexagonal boundaries.** `domain/` depends on nothing else in the package. `application/` depends on `domain/` and `ports/` only — never on `infrastructure/`. `infrastructure/` implements `ports/` and may depend on external SDKs. See [ARCHITECTURE.md](ARCHITECTURE.md).
- **No side effects on import.** A module must not open a file, spawn a process, or make a network call merely by being imported. Adapters take configuration through their constructor and touch the outside world only when a method is called.
- **Read before you write.** `ChangePlanner` and `RepositoryWritePolicy` exist to prevent blind overwrites and out-of-scope writes — don't bypass them from new code; extend them if the rule is wrong.
- **Errors are typed.** New failure modes get a `QaCoreError` subclass in `src/errors/index.ts`, not a bare `throw new Error(...)`. Never put secret values in an error's `details`.
- **Config is read once, at the edge.** Only `src/config/load-from-environment.ts` reads `process.env`. Everything else receives `QaCoreConfig` by injection.
- **Public API changes are semver-significant.** Additive changes (new exported function, new optional field) are safe. Renaming or removing an exported symbol, changing a method signature, or narrowing an input type is a breaking change — needs a major version bump and a MIGRATION.md note.

## Tests

- Every new module gets a co-located `*.test.ts` (Vitest picks up `src/**/*.test.ts`).
- Prefer the in-memory adapters in `src/testing/` over mocking library internals.
- Coverage thresholds are enforced in `vitest.config.ts` (currently 80% lines/statements/functions, 70% branches, checked in aggregate). `npm run test:coverage` fails the build if they regress.
- Adapters that wrap an external SDK (Octokit, `git` CLI) should be tested against either a fake/mock client (see `octokit-pull-request.adapter.test.ts`) or a real throwaway fixture (see `local-git-repository.adapter.test.ts`, which builds a temp git repo) — not against live external services.

## Commit and PR conventions

- Conventional-style subjects (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`) are appreciated but not enforced by tooling.
- Keep PRs scoped to one layer/concern where possible — a coverage-engine change and a GitHub-adapter change are easier to review separately.
- Update `CHANGELOG.md` under `Unreleased` for any user-visible change.

## Adding a new adapter

1. Define (or extend) the port interface in `src/ports/`.
2. Implement it under `src/infrastructure/<system>/`.
3. Add an in-memory or noop counterpart under `src/testing/` or alongside the adapter if it's simple enough to ship as a first-class option (see `NoopCodeContextAdapter`, `NoopProjectMemoryAdapter`).
4. Export it from the relevant subpath `index.ts` (check `tsup.config.ts` — new subpaths need an entry there too) and from `src/index.ts` if it belongs in the root barrel.
5. Never let the adapter leak into `application/` or `domain/` — those layers only see the port type.
