function test1() {



    const { YouTubeDL } = require('yt-streamer');

    (async () => {
        const result = await YouTubeDL('https://www.youtube.com/watch?v=36GT2zI8lVA');
        console.log(result);
        // Returns: { title, vid, url, quality: "360p", type: "mp4" }

        // Use the URL to stream or download
        const response = await fetch(result.url);
        const videoBuffer = await response.arrayBuffer();
        writeFileSync('tmp_video.mp4', Buffer.from(videoBuffer));
    })();


}

function test2() {
    const { DownloadMusic, DownloadVideo } = require('yt-streamer');
    const fs = require('fs');

    (async () => {
        // Download audio (M4A format)
        const audioPath = await DownloadMusic('36GT2zI8lVA');
        const audioBuffer = fs.readFileSync(audioPath);
        fs.writeFileSync('tmp_audio.m4a', Buffer.from(audioBuffer));

        // Download video (default: 480p, MP4 format)
        const videoPath = await DownloadVideo('36GT2zI8lVA');
        const videoBuffer = fs.readFileSync(videoPath);

        // Download video with custom quality (720p, 1080p, etc.)
        const hdVideoPath = await DownloadVideo('36GT2zI8lVA', '720');
        const hdVideoBuffer = fs.readFileSync(hdVideoPath);
    })();
}

test2()