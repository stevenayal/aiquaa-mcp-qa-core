export interface RepositoryMetadata {
  name: string;
  owner?: string;
  defaultBranch: string;
  url?: string;
}

export interface RepositoryFile {
  path: string;
  type: "file" | "directory";
  size?: number;
}

export interface RepositoryFileContent {
  path: string;
  content: string;
  encoding: "utf8" | "base64";
  sha?: string;
}

export interface RepositorySearchQuery {
  query: string;
  pathPrefix?: string;
  limit?: number;
}

export interface RepositorySearchResult {
  path: string;
  lineNumber?: number;
  snippet: string;
}

export interface RepositoryTree {
  ref: string;
  files: RepositoryFile[];
}

export interface RepositoryPort {
  getMetadata(): Promise<RepositoryMetadata>;
  getDefaultBranch(): Promise<string>;
  listFiles(ref?: string): Promise<RepositoryFile[]>;
  readFile(path: string, ref?: string): Promise<RepositoryFileContent>;
  search(query: RepositorySearchQuery): Promise<RepositorySearchResult[]>;
  getTree(ref?: string): Promise<RepositoryTree>;
}
