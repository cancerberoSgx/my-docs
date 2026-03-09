import type { ToolDoc, ToolResult } from './types';

export async function execute(doc: ToolDoc, action: string, _params: Record<string, unknown>): Promise<ToolResult> {
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  return {
    url: `https://example.com/text/${doc.id}.txt`,
    mimetype: 'text/plain',
    extra: { action },
  };
}
