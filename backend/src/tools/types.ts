export interface ToolResult {
  url: string;
  mimetype: string;
  extra: object;
}

export interface ToolDoc {
  id: number;
  url: string;
}

export interface ToolImpl {
  execute(doc: ToolDoc, action: string, params: Record<string, unknown>): Promise<ToolResult>;
}
