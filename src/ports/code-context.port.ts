export interface CodeContextRequest {
  projectPath: string;
  task: string;
  maxNodes?: number;
  maxCodeBlocks?: number;
  includeCode?: boolean;
}

export interface CodeContextFile {
  path: string;
  language?: string;
  snippet?: string;
}

export interface CodeSymbol {
  name: string;
  kind: string;
  path: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface CodeRelationship {
  fromSymbol: string;
  toSymbol: string;
  relation: string;
}

export interface CodeContextResult {
  files: CodeContextFile[];
  symbols: CodeSymbol[];
  relationships: CodeRelationship[];
  warnings: string[];
}

export interface CodeContextPort {
  analyzeRepository(input: CodeContextRequest): Promise<CodeContextResult>;
}
