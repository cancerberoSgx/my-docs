import type { ToolImpl } from './types';
import * as youtubeAudio from './youtubeAudio';
import * as youtubeVideo from './youtubeVideo';
import * as webpageText from './webpageText';

export const registry = new Map<string, ToolImpl>([
  ['youtube-audio', youtubeAudio],
  ['youtube-video', youtubeVideo],
  ['webpage-text', webpageText],
]);
