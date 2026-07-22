import { runCommand, type CommandRunner } from "../process/run-command.js";
import { parseAllowedRoots, resolveAllowedProjectPath } from "../process/allowed-roots.js";
import { CodeGraphError } from "../../errors/index.js";
import type { CodeContextPort, CodeContextRequest, CodeContextResult } from "../../ports/code-context.port.js";

export interface CodeGraphCliAdapterOptions {
  binary?: string;
  allowedRoots?: string[];
  runner?: CommandRunner;
  timeoutMs?: number;
}

/**
 * CodeContextPort backed by the `codegraph` CLI. Never mutates the repository —
 * restricted to allowedRoots, run with a timeout, and its markdown output is
 * parsed into a bounded, structured result.
 */
export class CodeGraphCliAdapter implements CodeContextPort {
  private readonly binary: string;
  private readonly allowedRoots: string[];
  private readonly runner: CommandRunner;
  private readonly timeoutMs: number;

  constructor(options: CodeGraphCliAdapterOptions = {}) {
    this.binary = options.binary?.trim() || "codegraph";
    this.allowedRoots = options.allowedRoots ?? parseAllowedRoots(process.env.CODEGRAPH_ALLOWED_ROOTS);
    this.runner = options.runner ?? runCommand;
    this.timeoutMs = options.timeoutMs ?? 45_000;
  }

  async analyzeRepository(input: CodeContextRequest): Promise<CodeContextResult> {
    const projectPath = resolveAllowedProjectPath(input.projectPath, this.allowedRoots);
    const args = [
      "context",
      input.task,
      "--path",
      projectPath,
      "--max-nodes",
      String(input.maxNodes ?? 25),
      "--max-code",
      String(input.maxCodeBlocks ?? 10),
      "--format",
      "json",
    ];
    if (input.includeCode === false) args.push("--no-code");

    let output: string;
    try {
      output = await this.runner({ command: this.binary, args, cwd: projectPath, timeoutMs: this.timeoutMs });
    } catch (error) {
      throw new CodeGraphError(`codegraph context failed for "${input.task}".`, { cause: error });
    }

    return this.parseOutput(output);
  }

  private parseOutput(output: string): CodeContextResult {
    try {
      const parsed = JSON.parse(output) as Partial<CodeContextResult>;
      return {
        files: parsed.files ?? [],
        symbols: parsed.symbols ?? [],
        relationships: parsed.relationships ?? [],
        warnings: parsed.warnings ?? [],
      };
    } catch {
      return { files: [], symbols: [], relationships: [], warnings: ["codegraph output was not valid JSON."] };
    }
  }
}
