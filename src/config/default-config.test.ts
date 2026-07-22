import { describe, expect, it } from "vitest";
import { createDefaultConfig } from "./default-config.js";

describe("createDefaultConfig", () => {
  it("defaults to a safe, dry-run configuration", () => {
    const config = createDefaultConfig();
    expect(config.security.dryRun).toBe(true);
    expect(config.security.allowedRoots).toEqual([]);
    expect(config.logging.level).toBe("info");
  });
});
