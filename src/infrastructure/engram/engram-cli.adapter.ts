import { runCommand, type CommandRunner } from "../process/run-command.js";
import { MemoryError } from "../../errors/index.js";
import { redact } from "../../security/redaction.js";
import type { MemoryEntry, MemorySaveInput, MemorySearchInput, ProjectMemoryPort } from "../../ports/memory.port.js";

export interface EngramCliAdapterOptions {
  binary?: string;
  projectPrefix?: string;
  runner?: CommandRunner;
  timeoutMs?: number;
  maxContentLength?: number;
}

/** ProjectMemoryPort backed by the `engram` CLI. Redacts content before it ever leaves the process. */
export class EngramCliAdapter implements ProjectMemoryPort {
  private readonly binary: string;
  private readonly projectPrefix: string;
  private readonly runner: CommandRunner;
  private readonly timeoutMs: number;
  private readonly maxContentLength: number;

  constructor(options: EngramCliAdapterOptions = {}) {
    this.binary = options.binary?.trim() || "engram";
    this.projectPrefix = options.projectPrefix?.trim() || "aiquaa-";
    this.runner = options.runner ?? runCommand;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.maxContentLength = options.maxContentLength ?? 4_000;
  }

  async search(input: MemorySearchInput): Promise<MemoryEntry[]> {
    const project = this.projectName(input.projectKey);
    let output: string;
    try {
      output = await this.runner({
        command: this.binary,
        args: ["search", input.query, "--project", project, "--scope", "project", "--limit", String(input.limit ?? 5)],
        timeoutMs: this.timeoutMs,
      });
    } catch (error) {
      throw new MemoryError(`engram search failed for project "${project}".`, { cause: error });
    }
    return this.parseEntries(output, project);
  }

  async save(input: MemorySaveInput): Promise<MemoryEntry> {
    const project = this.projectName(input.projectKey);
    const content = redact(input.content).slice(0, this.maxContentLength);
    try {
      await this.runner({
        command: this.binary,
        args: [
          "save",
          input.topicKey,
          content,
          "--type",
          input.type ?? "note",
          "--project",
          project,
          "--scope",
          "project",
          "--topic",
          input.topicKey,
        ],
        timeoutMs: this.timeoutMs,
      });
    } catch (error) {
      throw new MemoryError(`engram save failed for project "${project}".`, { cause: error });
    }
    const now = new Date().toISOString();
    return { projectKey: project, topicKey: input.topicKey, content, createdAt: now, updatedAt: now };
  }

  private projectName(projectKey: string): string {
    return `${this.projectPrefix}${projectKey}`.trim().toLowerCase();
  }

  private parseEntries(output: string, project: string): MemoryEntry[] {
    if (!output.trim()) return [];
    const now = new Date().toISOString();
    return [{ projectKey: project, topicKey: "search-result", content: output.trim(), createdAt: now, updatedAt: now }];
  }
}
