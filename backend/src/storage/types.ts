export interface Resource {
  url: string;
  mimetype: string;
}

export interface StorageDocument {
  id: number;
  url: string;
}

export interface StorageTool {
  name: string;
  action: string;
  params: Record<string, unknown>;
}

export interface FileStorage {
  load(document: StorageDocument, tool: StorageTool): Promise<Resource>;
}
