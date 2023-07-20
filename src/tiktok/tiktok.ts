import * as fs from "https://deno.land/std@0.194.0/fs/mod.ts";
import * as bytes from "https://deno.land/std@0.195.0/fmt/bytes.ts";
import ky from "https://esm.sh/ky@0.33.3?dts";
import ProgressBar from "https://deno.land/x/progress@v1.3.8/mod.ts";
import { readline } from "https://deno.land/x/readline@v1.1.0/mod.ts";
import { ITikTok, MediaUrl, DownloadedResult } from "./types.ts";

export class Tiktok {
  private baseApiUrl =
    "https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/";

  constructor(private downloadPath: string) {}

  setDownloadPath(path: string) {
    this.downloadPath = path;
  }

  async fromTxtFile(path: string, wm = false) {
    if (!fs.existsSync(path)) {
      console.log("❌ Error: File not found");
      Deno.exit();
    }

    const links: string[] = [];
    const decoder = new TextDecoder();
    const file = await Deno.open(path, { read: true });
    for await (const line of readline(file)) {
      const link = decoder.decode(line);
      links.push(link);
    }
    file.close();

    console.log(`Total downloads: ${links.length}`);

    const videos: DownloadedResult[] = [];
    for (const link of links) {
      const video = await this.fromLink(link, wm);

      if (video) {
        videos.push(video);
      }
    }

    return videos;
  }

  async fromLink(link: string, wm = false) {
    let videoUrl;
    if (wm) {
      videoUrl = await this.getVideoUrlWM(link);
    } else {
      videoUrl = await this.getVideoUrlNoWM(link);
    }

    if (videoUrl) {
      return this.downloadVideo(videoUrl);
    }

    return null;
  }

  async fromVideoId(videoId: string) {
    const data = await this.fetchVideoInfo(videoId);
    const videoUrl = data.aweme_list[0].video.download_addr.url_list[0];

    return this.downloadVideo({ videoId, videoUrl });
  }

  async getVideoIdFromLink(link: string) {
    const cleanUrl = await this.cleanUrl(link);
    const url = new URL(cleanUrl);

    if (!url.pathname.includes("/video/")) {
      throw new Error("❌ Invalid URL " + link);
    }

    return url.pathname.split("/video/")[1];
  }

  async getVideoUrlWM(link: string): Promise<MediaUrl | null> {
    try {
      const videoId = await this.getVideoIdFromLink(link);
      const data = await this.fetchVideoInfo(videoId);
      const videoUrl = data.aweme_list[0].video.download_addr.url_list[0];

      return { videoUrl, videoId };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getVideoUrlNoWM(link: string): Promise<MediaUrl | null> {
    try {
      const videoId = await this.getVideoIdFromLink(link);
      const data = await this.fetchVideoInfo(videoId);
      const videoUrl = data.aweme_list[0].video.play_addr.url_list[0];

      return { videoUrl, videoId };
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async cleanUrl(url: string) {
    if (url.includes("vm.tiktok.com") || url.includes("vt.tiktok.com")) {
      const res = await fetch(url, {
        redirect: "follow",
        // follow: 10,
      });
      url = res.url;
      console.log("⟿ Redirecting to: " + url);
    }

    return url;
  }

  async fetchVideoInfo(videoId: string): Promise<ITikTok> {
    const videoUrl = `${this.baseApiUrl}?aweme_id=${videoId}`;

    const headers = new Headers();
    headers.append(
      "User-Agent",
      "TikTok 26.2.0 rv:262018 (iPhone; iOS 14.4.2; en_US) Cronet"
    );

    const res = await fetch(videoUrl, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.error("Error:", res.statusText);
      console.error("Response body:", res.body);
    }

    return res.json();
  }

  async downloadVideo({
    videoUrl,
    videoId,
  }: MediaUrl): Promise<DownloadedResult | null> {
    const progressBar = new ProgressBar({
      total: 100,
      complete: "=",
      incomplete: "-",
    });

    const resp = await ky(videoUrl, {
      onDownloadProgress: (progress, _chunk) => {
        progressBar.render(Math.round(progress.percent * 100));
        const transferred = bytes.format(progress.transferredBytes);
        const total = bytes.format(progress.totalBytes);
        progressBar.display = `Downloading video: ${videoId} :percent [:bar] :time [${transferred} - ${total}] eta :eta `;
      },
    });

    if (!resp.ok || !resp.body) {
      console.log(`❌ Failed download video: ${videoId}`);
      return null;
    }

    const fileName = `${videoId}.mp4`;
    const videoPath = `${this.downloadPath}/${fileName}`;

    if (!fs.existsSync(this.downloadPath)) {
      await Deno.mkdir(this.downloadPath);
    }

    const file = await Deno.open(videoPath, { write: true, create: true });
    await resp.body.pipeTo(file.writable);

    return { videoId, videoPath };
  }
}
