/**
 * Burns captions BELOW the video — not on it.
 * Creates a separate black bar, draws text into it, vstacks with video.
 *
 * Usage:
 *   pnpm tsx scripts/burn-captions-below.ts <input.mp4> <captions.srt> <output.mp4>
 */

import { execSync } from 'child_process';
import fs from 'fs';

const [,, inputVideo, srtFile, outputVideo] = process.argv;
if (!inputVideo || !srtFile || !outputVideo) {
  console.error('Usage: burn-captions-below.ts <input.mp4> <captions.srt> <output.mp4>');
  process.exit(1);
}

interface Caption { start: number; end: number; text: string; }

function parseSrt(srtPath: string): Caption[] {
  const content = fs.readFileSync(srtPath, 'utf-8');
  const blocks = content.trim().split(/\n\n+/);
  const captions: Caption[] = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    const match = lines[1].match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (!match) continue;
    const toSec = (h: string, m: string, s: string, ms: string) =>
      parseInt(h)*3600 + parseInt(m)*60 + parseInt(s) + parseInt(ms)/1000;
    const start = toSec(match[1], match[2], match[3], match[4]);
    const end   = toSec(match[5], match[6], match[7], match[8]);
    const text  = lines.slice(2).join(' ')
      .replace(/\\/g, '')
      .replace(/'/g, '\u2019')
      .replace(/"/g, '\u201c')
      .replace(/[<>]/g, '')
      .trim();
    if (text) captions.push({ start, end, text });
  }
  return captions;
}

function main() {
  const captions = parseSrt(srtFile);
  console.log(`Parsed ${captions.length} captions`);

  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
  const BAR_H = 100;
  const VIDEO_W = 1920;

  // Build one drawtext filter per caption, all drawn into the caption bar (320x100 → scaled to 1920x100)
  const drawtexts = captions.map(c => {
    const safe = c.text
      .replace(/\\/g, '')
      .replace(/'/g, '\u2019')
      .replace(/:/g, '\:')
      .replace(/\[/g, '').replace(/\]/g, '');
    return (
      `drawtext=text='${safe}':` +
      `fontfile=${font}:fontsize=30:fontcolor=white:` +
      `x=(w-text_w)/2:y=(h-text_h)/2:` +
      `enable='between(t,${c.start.toFixed(3)},${c.end.toFixed(3)})'`
    );
  }).join(',');

  // filter_complex:
  // input 0 = video, input 1 = black bar PNG (loop -1 = infinite loop, trimmed by -shortest)
  // [vid] = video scaled to fit 1920x1080 letterboxed
  // [bar] = black bar with captions drawn in
  // vstack = 1920x1180 — captions physically below video, never touching it
  const filter = [
    `[0:v]scale=${VIDEO_W}:1080:force_original_aspect_ratio=decrease,`,
    `pad=${VIDEO_W}:1080:(ow-iw)/2:(oh-ih)/2:black,setsar=1[vid];`,
    `[1:v]loop=-1:1:0,scale=${VIDEO_W}:${BAR_H},setsar=1,`,
    `${drawtexts}[bar];`,
    `[vid][bar]vstack=inputs=2[out]`,
  ].join('');

  console.log('Rendering...');
  execSync(
    `ffmpeg -y -i "${inputVideo}" -loop 1 -i /tmp/black-bar.png ` +
    `-filter_complex "${filter}" ` +
    `-map "[out]" -map 0:a ` +
    `-c:v libx264 -preset ultrafast -crf 20 ` +
    `-c:a copy -shortest -movflags +faststart "${outputVideo}"`,
    { stdio: 'inherit' }
  );

  const mb = fs.statSync(outputVideo).size / 1024 / 1024;
  console.log(`\n✅ ${outputVideo} — ${mb.toFixed(1)}MB`);
}

main();
