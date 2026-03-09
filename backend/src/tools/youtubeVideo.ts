import { storage } from '../storage';
import type { ToolDoc, ToolResult } from './types';

export async function execute(doc: ToolDoc, action: string, params: Record<string, unknown>): Promise<ToolResult> {
  const resource = await storage.load(doc, { name: 'youtube-video', action, params });
  return { url: resource.url, mimetype: resource.mimetype, extra: { action } };
}
