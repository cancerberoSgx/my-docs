import fs from 'fs';
import path from 'path';
import { download } from '../integrations/youtube';
import type { FileStorage, Resource, StorageDocument, StorageTool } from './types';

const MEDIA_DIR = process.env.MEDIA_DIR ?? path.resolve(process.cwd(), 'media');
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';

function ensureMediaDir(): void {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
}

function extractYoutubeId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) throw new Error(`Cannot extract YouTube video ID from URL: ${url}`);
  return match[1];
}

const TOOL_CONFIG: Record<string, { type: 'audio' | 'video'; ext: string; mimetype: string }> = {
  'youtube-audio': { type: 'audio', ext: 'm4a', mimetype: 'audio/mp4' },
  'youtube-video': { type: 'video', ext: 'mp4', mimetype: 'video/mp4' },
};

export const localFileStorage: FileStorage = {
  async load(document: StorageDocument, tool: StorageTool): Promise<Resource> {
    const config = TOOL_CONFIG[tool.name];
    if (!config) throw new Error(`No storage config for tool: ${tool.name}`);

    ensureMediaDir();

    const videoId = extractYoutubeId(document.url);
    const filename = `${document.id}-${videoId}.${config.ext}`;
    const destPath = path.join(MEDIA_DIR, filename);

    if (!fs.existsSync(destPath)) {
      const sourcePath = await download({ id: videoId, type: config.type });
      fs.copyFileSync(sourcePath, destPath);
    }

    return {
      url: `${BACKEND_URL}/media/${filename}`,
      mimetype: config.mimetype,
    };
  },
};
