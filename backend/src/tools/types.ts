export interface ToolResult {
  url: string;
  mimetype: string;
  extra: object;
}

export interface ToolImpl {
  execute(docId: number, action: string, params: Record<string, unknown>): Promise<ToolResult>;
}
