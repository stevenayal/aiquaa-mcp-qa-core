// eslint-disable-next-line no-control-regex -- intentionally stripping ASCII control chars
const CONTROL_CHARS_PATTERN = new RegExp("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "g");

/** Strips control characters and clamps length for any free-text input crossing an MCP tool boundary. */
export class InputSanitizer {
  sanitizeText(value: string, maxLength = 20_000): string {
    const withoutControlChars = value.replace(CONTROL_CHARS_PATTERN, "");
    return withoutControlChars.length > maxLength
      ? withoutControlChars.slice(0, maxLength)
      : withoutControlChars;
  }

  sanitizeIdentifier(value: string): string {
    return value.trim().replace(/[^A-Za-z0-9._-]/g, "");
  }
}
