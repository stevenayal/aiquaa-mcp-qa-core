export type SecretSeverity = "low" | "medium" | "high" | "critical";

export interface SecretFinding {
  path?: string;
  line?: number;
  type: string;
  severity: SecretSeverity;
  /** Never the full secret — first/last few chars only. */
  redactedValue: string;
  recommendation: string;
}

interface SecretPattern {
  type: string;
  severity: SecretSeverity;
  pattern: RegExp;
  recommendation: string;
}

const PATTERNS: SecretPattern[] = [
  {
    type: "github_token",
    severity: "critical",
    pattern: /gh[pousr]_[A-Za-z0-9]{36,255}/g,
    recommendation: "Revoke the GitHub token and load it from GITHUB_TOKEN instead.",
  },
  {
    type: "aws_access_key",
    severity: "critical",
    pattern: /AKIA[0-9A-Z]{16}/g,
    recommendation: "Rotate the AWS access key and use a secrets manager.",
  },
  {
    type: "azure_secret",
    severity: "high",
    pattern: /(?:AZURE|AZ)_[A-Z_]*(?:SECRET|KEY)\s*[:=]\s*["']?[A-Za-z0-9._~-]{16,}/g,
    recommendation: "Store Azure secrets in a managed key vault, not in code.",
  },
  {
    type: "supabase_service_role_key",
    severity: "critical",
    pattern: /sb-[a-z0-9]{20,}-service-role[A-Za-z0-9._-]*/gi,
    recommendation: "Never expose the Supabase service role key outside trusted server contexts.",
  },
  {
    type: "jwt",
    severity: "medium",
    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    recommendation: "JWTs can carry credentials — confirm this is not a live token before committing.",
  },
  {
    type: "private_key",
    severity: "critical",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
    recommendation: "Never commit private keys. Rotate the key pair immediately.",
  },
  {
    type: "bearer_token",
    severity: "high",
    pattern: /Bearer\s+[A-Za-z0-9._-]{20,}/g,
    recommendation: "Remove hardcoded bearer tokens; read them from environment/config at runtime.",
  },
  {
    type: "basic_auth_credentials",
    severity: "high",
    pattern: /:\/\/[^\s/:]+:[^\s/@]{4,}@/g,
    recommendation: "Do not embed basic-auth credentials in URLs.",
  },
  {
    type: "connection_string",
    severity: "high",
    pattern: /(?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^\s"']{6,}/gi,
    recommendation: "Move connection strings to environment configuration.",
  },
  {
    type: "generic_api_key",
    severity: "medium",
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}["']?/gi,
    recommendation: "Move API keys out of source and into environment configuration.",
  },
  {
    type: "generic_password",
    severity: "medium",
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*["'][^"'\s]{6,}["']/gi,
    recommendation: "Do not hardcode passwords; use a secrets manager.",
  },
];

function redactValue(match: string): string {
  if (match.length <= 8) return "****";
  return `${match.slice(0, 3)}…${match.slice(-3)}`;
}

export interface SecretScanOptions {
  path?: string;
}

export interface RawSecretMatch {
  match: string;
  redactedValue: string;
  type: string;
}

/** Returns the actual matched substrings (not line-indexed) — used by redact() to mask real content. */
export function findRawMatches(content: string): RawSecretMatch[] {
  const matches: RawSecretMatch[] = [];
  for (const pattern of PATTERNS) {
    pattern.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.pattern.exec(content)) !== null) {
      matches.push({ match: match[0], redactedValue: redactValue(match[0]), type: pattern.type });
      if (!pattern.pattern.global) break;
    }
  }
  return matches;
}

export class SecretScanner {
  scanText(content: string, options: SecretScanOptions = {}): SecretFinding[] {
    const findings: SecretFinding[] = [];
    const lines = content.split(/\r?\n/);

    for (const pattern of PATTERNS) {
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex] ?? "";
        pattern.pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.pattern.exec(line)) !== null) {
          findings.push({
            ...(options.path ? { path: options.path } : {}),
            line: lineIndex + 1,
            type: pattern.type,
            severity: pattern.severity,
            redactedValue: redactValue(match[0]),
            recommendation: pattern.recommendation,
          });
          if (!pattern.pattern.global) break;
        }
      }
    }
    return findings;
  }

  scanFiles(files: Array<{ path: string; content: string }>): SecretFinding[] {
    return files.flatMap((file) => this.scanText(file.content, { path: file.path }));
  }

  hasSecrets(content: string): boolean {
    return this.scanText(content).length > 0;
  }
}
