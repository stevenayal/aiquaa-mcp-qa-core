import path from "node:path";
import { UnsafePathError } from "../errors/index.js";

const BLOCKED_SEGMENTS = new Set([".git", "node_modules"]);

export interface PathPolicyOptions {
  allowedRoots: string[];
}

/** Rejects path traversal, absolute paths outside the workspace, and privileged directories. */
export class PathPolicy {
  private readonly allowedRoots: string[];

  constructor(options: PathPolicyOptions) {
    if (options.allowedRoots.length === 0) {
      throw new UnsafePathError("PathPolicy requires at least one allowed root.");
    }
    this.allowedRoots = options.allowedRoots.map((root) => path.resolve(root));
  }

  assertSafe(candidatePath: string): string {
    const normalized = candidatePath.replace(/\\/g, "/");
    const segments = normalized.split("/").filter(Boolean);

    for (const segment of segments) {
      if (segment === "..") {
        throw new UnsafePathError(`Path traversal detected in "${candidatePath}".`, {
          details: { path: candidatePath },
        });
      }
      if (BLOCKED_SEGMENTS.has(segment)) {
        throw new UnsafePathError(`Path "${candidatePath}" touches a blocked directory (${segment}).`, {
          details: { path: candidatePath, segment },
        });
      }
    }

    const root = this.allowedRoots.find((candidate) => this.isWithinRoot(candidatePath, candidate));
    if (!root) {
      throw new UnsafePathError(`Path "${candidatePath}" is outside the allowed workspace roots.`, {
        details: { path: candidatePath, allowedRoots: this.allowedRoots },
      });
    }

    return path.resolve(root, candidatePath.replace(/^[/\\]+/, ""));
  }

  isSafe(candidatePath: string): boolean {
    try {
      this.assertSafe(candidatePath);
      return true;
    } catch {
      return false;
    }
  }

  private isWithinRoot(candidatePath: string, root: string): boolean {
    const resolved = path.isAbsolute(candidatePath)
      ? path.resolve(candidatePath)
      : path.resolve(root, candidatePath);
    const relative = path.relative(root, resolved);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  }
}
