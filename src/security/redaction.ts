import { findRawMatches } from "./secret-scanner.js";

/** Replaces any detected secret substrings in `text` with a redacted marker. Safe for logs. */
export function redact(text: string): string {
  const matches = findRawMatches(text);
  if (matches.length === 0) return text;

  let redacted = text;
  for (const match of matches) {
    redacted = redacted.split(match.match).join(match.redactedValue);
  }
  return redacted;
}

export class RedactionService {
  redactText(text: string): string {
    return redact(text);
  }

  redactObject<T>(value: T): T {
    return this.redactValue(value) as T;
  }

  private redactValue(value: unknown): unknown {
    if (typeof value === "string") return redact(value);
    if (Array.isArray(value)) return value.map((item) => this.redactValue(item));
    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        result[key] = this.redactValue(val);
      }
      return result;
    }
    return value;
  }
}
