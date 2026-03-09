import type { ToolResult } from './types';

export async function execute(docId: number, action: string, _params: Record<string, unknown>): Promise<ToolResult> {
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  return {
    url: `https://example.com/video/${docId}.mp4`,
    mimetype: 'video/mp4',
    extra: { action },
  };
}
