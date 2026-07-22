# Security

## Reporting a vulnerability

Open a private security advisory on the [GitHub repository](https://github.com/stevenayal/aiquaa-mcp-qa-core/security/advisories/new), or email the maintainers listed in `package.json`. Do not open a public issue for a suspected vulnerability. Include the version, a minimal reproduction, and the impact as you understand it. We aim to acknowledge within a few business days.

## What this package guards against

`@aiquaa/mcp-qa-core` is infrastructure other MCP servers build on, so it treats several classes of mistake as security-relevant, not just correctness bugs:

- **Path traversal and workspace escape** — every filesystem/patch operation goes through `PathPolicy`, which rejects `..` segments, `.git`/`node_modules` targets, and any path resolving outside the configured `allowedRoots`.
- **Unbounded repository writes** — `RepositoryWritePolicy` requires an explicit repository, base branch, scope, and file list before any write is permitted, and defaults `dryRun` to `true`. There is no "write everywhere" code path.
- **Secret leakage** — `SecretScanner` detects GitHub/AWS/Azure/Supabase tokens, JWTs, private keys, bearer tokens, basic-auth credentials, connection strings, and generic API keys/passwords before content is written to a repository, logged, or persisted to memory (Engram). `SecretFinding.redactedValue` never contains the full secret. `ConsoleLoggerAdapter` and the Engram adapters redact automatically.
- **Uncontrolled process execution** — `ExecutionPolicy` requires an allow-listed command and enforces a maximum timeout; adapters that shell out (`CodeGraphCliAdapter`, `EngramCliAdapter`, `LocalGitRepositoryAdapter`) never use a shell (`execFile`, not `exec`) and pass arguments as an array, so there is no command-injection surface via string concatenation.
- **Unrestricted outbound HTTP** — `HostPolicy` is available for adapters that should only call a known set of hosts (e.g. a locked-down AIQUAA deployment).
- **Blind overwrites** — `ChangePlanner` refuses `modify`/`delete` decisions unless `hasReadExistingContent: true` was set, and refuses `delete` without an explicit non-empty justification.

## Reporting expectations for consumer MCPs

If you build an MCP server on top of this core:

- Always construct `PathPolicy`/`RepositoryWritePolicy` with `allowedRoots` scoped to the actual project workspace, never `/` or a bare drive root.
- Keep `dryRun: true` as the default in your own tool surface; require an explicit, user-visible opt-in before flipping it.
- Don't log `QaCoreError.details` verbatim if you've added your own error subclasses with details that might carry sensitive data — the base class documents that details must never contain secrets, but that's a convention your own error types must also honor.
- Pass AIQUAA bearer tokens per-call (`HttpAiquaaAdapter`'s per-call `accessToken` option) rather than baking a single long-lived token into a long-running process where avoidable.

## Supported versions

Security fixes are released against the latest minor version on the current major line. There is no long-term support for older majors once a new major ships.
