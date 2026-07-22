import { execFile } from "node:child_process";
import { ExternalProcessError, TimeoutError } from "../../errors/index.js";

export interface CommandRequest {
  command: string;
  args: string[];
  cwd?: string;
  timeoutMs?: number;
  maxBufferBytes?: number;
}

export type CommandRunner = (request: CommandRequest) => Promise<string>;

/** Runs an external binary with a fixed argv (no shell), enforcing timeout and output-size limits. */
export const runCommand: CommandRunner = (request) =>
  new Promise((resolve, reject) => {
    execFile(
      request.command,
      request.args,
      {
        ...(request.cwd ? { cwd: request.cwd } : {}),
        timeout: request.timeoutMs ?? 30_000,
        maxBuffer: request.maxBufferBytes ?? 2 * 1024 * 1024,
        windowsHide: true,
        shell: false,
        encoding: "utf8",
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr.trim() || error.message;
          if (error.killed || /timed?\s*out/i.test(error.message)) {
            reject(new TimeoutError(`${request.command} timed out after ${request.timeoutMs ?? 30_000}ms.`));
            return;
          }
          reject(new ExternalProcessError(`${request.command} failed: ${detail}`));
          return;
        }
        resolve(stdout.trim());
      },
    );
  });
