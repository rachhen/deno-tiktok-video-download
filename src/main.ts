import { Tiktok } from "./tiktok/tiktok.ts";

const dest = "downloads";
const tiktok = new Tiktok(dest);

const info = await tiktok.fetchVideoInfo("7250423344426781978");
const video = await tiktok.fromVideoId("7256955274995485995");
console.log(video);
console.log(JSON.stringify(info.aweme_list[0].video.play_addr, null, 2));
