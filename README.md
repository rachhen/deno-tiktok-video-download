## Simple Tiktok Download

Using:

```sh
git clone repo

deno run -A src/cli.ts -link https://www.tiktok.com/@the_birds_channel/video/7256955274995485995
```

or you can compile it

```
deno compile --allow-read --allow-write --allow-net src/cli.ts --output bin/cli

bin/cli --link https://www.tiktok.com/@the_birds_channel/video/7256955274995485995

# Download using links on .txt file
bin/cli -f video_links.txt

# Download by video id custom folder
bin/cli --vid 7256955274995485995 -d folder

# Download by video id with watermark
bin/cli --vid 7256955274995485995 --wv

```
