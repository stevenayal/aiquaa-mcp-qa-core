import type { CodeContextPort, CodeContextRequest, CodeContextResult } from "../../ports/code-context.port.js";

export class NoopCodeContextAdapter implements CodeContextPort {
  async analyzeRepository(input: CodeContextRequest): Promise<CodeContextResult> {
    return {
      files: [],
      symbols: [],
      relationships: [],
      warnings: [`CodeGraph is not configured — skipped analysis for "${input.task}".`],
    };
  }
}
