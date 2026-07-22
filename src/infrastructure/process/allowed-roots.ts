import path from "node:path";
import { UnsafePathError } from "../../errors/index.js";

export function parseAllowedRoots(value: string | undefined): string[] {
  return (value ?? "")
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => path.resolve(entry));
}

export function resolveAllowedProjectPath(projectPath: string, allowedRoots: string[]): string {
  if (allowedRoots.length === 0) {
    throw new UnsafePathError("No allowed roots configured — refusing to resolve any project path.");
  }
  const resolved = path.resolve(projectPath);
  const allowed = allowedRoots.some((root) => isPathInside(resolved, root));
  if (!allowed) {
    throw new UnsafePathError(`"${resolved}" is outside the configured allowed roots.`);
  }
  return resolved;
}

function isPathInside(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
