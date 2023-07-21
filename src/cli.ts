import {
  FlagOptions,
  ParseFlagsContext,
  parseFlags,
} from "https://deno.land/x/cliffy@v1.0.0-rc.2/flags/mod.ts";
import { Tiktok } from "./tiktok/tiktok.ts";
import { CmdOptions } from "./tiktok/types.ts";

const { flags } = parseFlags<CmdOptions, FlagOptions, ParseFlagsContext>(
  Deno.args
);

const dest = flags.dest || flags.d || "downloads";
const tiktok = new Tiktok(dest);

if (flags.link || flags.l) {
  const video = await tiktok.fromLink(flags.link || flags.l, flags.wm);

  if (video) {
    console.log(
      `✅ Video ${video.videoId} downloaded. Please check on ${dest} folder`
    );
  }
} else if (flags.vid) {
  const video = await tiktok.fromVideoId(flags.vid);

  if (video) {
    console.log(
      `✅ Video ${video.videoId} downloaded. Please check on ${dest} folder`
    );
  }
} else if (flags.f) {
  const videos = await tiktok.fromTxtFile(flags.f, flags.wm);

  console.log(
    `✅ ${videos.length} videos downloaded. Please check on ${dest} folder`
  );
} else {
  console.log(`
  --vid   [videoId]   Download video using video id from link
  -f     [filename]   You want to download video from Tiktok with link list on .txt file.

  -l|--link  [link]   You want to download video with specific link from Tiktok.

  --wm                Use this when you want to download video with watermark. 
                      You can combine with -f or --link
  -d|--dest [path]    If you want to customize destination store video use this option. default: ${dest}
  `);
}
