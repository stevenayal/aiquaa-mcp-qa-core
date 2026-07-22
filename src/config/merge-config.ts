import type { QaCoreConfig } from "./types.js";

/** Shallow-merges section by section; `override` wins whenever a section is present. */
export function mergeConfig(base: QaCoreConfig, override: Partial<QaCoreConfig>): QaCoreConfig {
  return {
    logging: { ...base.logging, ...override.logging },
    security: { ...base.security, ...override.security },
    github: override.github ? { ...base.github, ...override.github } : base.github,
    aiquaa: override.aiquaa ? { ...base.aiquaa, ...override.aiquaa } : base.aiquaa,
    codeGraph: override.codeGraph ? { ...base.codeGraph, ...override.codeGraph } : base.codeGraph,
    memory: override.memory ? { ...base.memory, ...override.memory } : base.memory,
  };
}
