import type { ToolResult } from './types';

export async function execute(docId: number, action: string, _params: Record<string, unknown>): Promise<ToolResult> {
  await new Promise((resolve) => setTimeout(resolve, 5_000));
  return {
    url: `https://example.com/audio/${docId}.mp3`,
    mimetype: 'audio/mpeg',
    extra: { action },
  };
}
