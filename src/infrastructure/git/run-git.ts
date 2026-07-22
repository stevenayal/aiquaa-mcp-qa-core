import { execFile } from "node:child_process";
import { RepositoryNotFoundError } from "../../errors/index.js";

export interface RunGitOptions {
  cwd: string;
  timeoutMs?: number;
}

/** Executes `git` with a fixed argv array (no shell) so no argument can be interpreted as a shell command. */
export function runGit(args: string[], options: RunGitOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd: options.cwd,
        timeout: options.timeoutMs ?? 30_000,
        maxBuffer: 8 * 1024 * 1024,
        windowsHide: true,
        shell: false,
        encoding: "utf8",
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new RepositoryNotFoundError(`git ${args.join(" ")} failed: ${stderr.trim() || error.message}`));
          return;
        }
        resolve(stdout);
      },
    );
  });
}
