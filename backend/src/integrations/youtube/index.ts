
import { DownloadMusic, DownloadVideo } from 'yt-streamer'
import fs from 'fs';

export interface YoutubeDownloaderProps {
    id: string
    type: 'audio' | 'video'
    quality?: string
}
export async function download({ id, type, quality }: YoutubeDownloaderProps) {
    if (type === 'audio') {
        const audioPath = await DownloadMusic(id);
        const audioBuffer = fs.readFileSync(audioPath);
        fs.writeFileSync(`tmp_${id}.m4a`, Buffer.from(audioBuffer));
        return `tmp_${id}.m4a`
    } else {
        const videoPath = await DownloadVideo(id, quality);
        const videoBuffer = fs.readFileSync(videoPath);
        fs.writeFileSync(`tmp_${id}.mp4`, Buffer.from(videoBuffer));
        return `tmp_${id}.mp4`
    }

}