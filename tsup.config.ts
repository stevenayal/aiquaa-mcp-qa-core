import { defineConfig } from "tsup";

const entries = {
  index: "src/index.ts",
  "requirements/index": "src/domain/requirements/index.ts",
  "coverage/index": "src/domain/coverage/index.ts",
  "traceability/index": "src/domain/traceability/index.ts",
  "changes/index": "src/domain/changes/index.ts",
  "patches/index": "src/patches/index.ts",
  "repository/index": "src/infrastructure/git/index.ts",
  "github/index": "src/infrastructure/github/index.ts",
  "aiquaa/index": "src/infrastructure/aiquaa/index.ts",
  "codegraph/index": "src/infrastructure/codegraph/index.ts",
  "memory/index": "src/infrastructure/engram/index.ts",
  "security/index": "src/security/index.ts",
  "mcp/index": "src/mcp/index.ts",
  "testing/index": "src/testing/index.ts",
};

export default defineConfig({
  entry: entries,
  format: ["esm"],
  target: "node20",
  platform: "node",
  dts: true,
  sourcemap: true,
  splitting: true,
  clean: true,
  treeshake: true,
  skipNodeModulesBundle: true,
  outDir: "dist",
});
