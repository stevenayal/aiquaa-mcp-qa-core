import { PatchGenerationError } from "../errors/index.js";
import { applyUnifiedDiff } from "./unified-diff.js";
import type { FilePatch } from "./types.js";

export interface FileReader {
  (path: string): Promise<string | undefined>;
}

export interface FileWriter {
  (path: string, content: string | undefined): Promise<void>;
}

/** Applies FilePatch objects against a caller-supplied read/write pair (e.g. a FileSystemPort). */
export class PatchApplier {
  async applyToContent(originalContent: string, patch: FilePatch): Promise<string> {
    if (patch.operation === "delete") {
      throw new PatchGenerationError(`Cannot materialize content for a delete patch on "${patch.path}".`);
    }
    if (patch.operation === "create" && originalContent !== "") {
      throw new PatchGenerationError(`Create patch for "${patch.path}" expects empty original content.`);
    }
    return applyUnifiedDiff(originalContent, patch.unifiedDiff);
  }

  async apply(patch: FilePatch, read: FileReader, write: FileWriter): Promise<void> {
    if (patch.operation === "delete") {
      await write(patch.path, undefined);
      return;
    }
    const existing = (await read(patch.path)) ?? "";
    const nextContent = await this.applyToContent(existing, patch);
    await write(patch.path, nextContent);
  }

  async applyAll(patches: FilePatch[], read: FileReader, write: FileWriter): Promise<void> {
    for (const patch of patches) {
      await this.apply(patch, read, write);
    }
  }
}
