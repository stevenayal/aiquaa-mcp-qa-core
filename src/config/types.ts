export type LogLevelName = "debug" | "info" | "warn" | "error";

export interface LoggingConfig {
  level: LogLevelName;
}

export interface GitHubConfig {
  token?: string;
  apiUrl?: string;
}

export interface AiquaaConfig {
  apiBaseUrl?: string;
  accessToken?: string;
}

export interface CodeGraphConfig {
  bin: string;
  allowedRoots: string[];
}

export interface MemoryConfig {
  bin: string;
  projectPrefix: string;
}

export interface SecurityConfig {
  allowedRoots: string[];
  maxFileSizeBytes: number;
  dryRun: boolean;
}

export interface QaCoreConfig {
  logging: LoggingConfig;
  github?: GitHubConfig;
  aiquaa?: AiquaaConfig;
  codeGraph?: CodeGraphConfig;
  memory?: MemoryConfig;
  security: SecurityConfig;
}
