import { describe, expect, it } from "vitest";
import { ExternalProcessError } from "../../errors/index.js";
import { runCommand } from "./run-command.js";

describe("runCommand", () => {
  it("runs node -e and returns trimmed stdout", async () => {
    const output = await runCommand({ command: process.execPath, args: ["-e", "console.log('hello')"] });
    expect(output).toBe("hello");
  });

  it("rejects with ExternalProcessError on a non-zero exit", async () => {
    await expect(
      runCommand({ command: process.execPath, args: ["-e", "process.exit(1)"] }),
    ).rejects.toBeInstanceOf(ExternalProcessError);
  });
});
