export interface FileSystemPort {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  listFiles(path: string): Promise<string[]>;
  createDirectory(path: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
}
