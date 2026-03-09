declare module 'yt-streamer' {
  /**
   * Downloads audio from a YouTube video and returns the path to the downloaded file (M4A format).
   * @param videoId - The YouTube video ID
   */
  export function DownloadMusic(videoId: string): Promise<string>;

  /**
   * Downloads video from YouTube and returns the path to the downloaded file (MP4 format).
   * @param videoId - The YouTube video ID
   * @param quality - Optional quality setting (e.g. '480', '720', '1080'). Defaults to 480p.
   */
  export function DownloadVideo(videoId: string, quality?: string): Promise<string>;
}
