/**
 * Burns captions from an SRT file into the black zone below the video.
 * Uses ffmpeg drawtext with fixed Y position — no subtitle filter.
 *
 * Usage:
 *   pnpm tsx scripts/burn-captions.ts <input.mp4> <captions.srt> <output.mp4>
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const [,, inputVideo, srtFile, outputVideo] = process.argv;
if (!inputVideo || !srtFile || !outputVideo) {
  console.error('Usage: burn-captions.ts <input.mp4> <captions.srt> <output.mp4>');
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
    const timeLine = lines[1];
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (!match) continue;
    const toSec = (h: string, m: string, s: string, ms: string) =>
      parseInt(h)*3600 + parseInt(m)*60 + parseInt(s) + parseInt(ms)/1000;
    const start = toSec(match[1], match[2], match[3], match[4]);
    const end   = toSec(match[5], match[6], match[7], match[8]);
    const text  = lines.slice(2).join(' ')
      .replace(/'/g, "\u2019")   // smart quote to avoid ffmpeg escape issues
      .replace(/[\\:]/g, ' ')
      .trim();
    if (text) captions.push({ start, end, text });
  }
  return captions;
}

function buildDrawtext(captions: Caption[], frameH: number, videoH: number): string {
  // Caption zone starts at videoH (1080), center of zone = videoH + 60
  const captionY = videoH + 30; // 30px into the black zone
  const font = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';

  return captions.map(c => {
    const text = c.text.replace(/'/g, "\u2019");
    return (
      `drawtext=text='${text}':` +
      `fontfile=${font}:` +
      `fontsize=28:fontcolor=white:` +
      `x=(w-text_w)/2:y=${captionY}:` +
      `box=1:boxcolor=black@0.0:boxborderw=0:` +
      `enable='between(t,${c.start},${c.end})'`
    );
  }).join(',');
}

function main() {
  const captions = parseSrt(srtFile);
  console.log(`Parsed ${captions.length} captions from ${srtFile}`);

  // Get frame dimensions
  const probeOut = execSync(
    `ffprobe -v error -show_entries stream=width,height -of csv=p=0 "${inputVideo}"`,
    { encoding: 'utf-8' }
  ).trim().split('\n')[0];
  const [frameW, frameH] = probeOut.split(',').map(Number);
  const videoH = 1080; // actual video content height
  console.log(`Frame: ${frameW}x${frameH}, video content: ${frameW}x${videoH}, caption zone: y=${videoH}–${frameH}`);

  const drawtext = buildDrawtext(captions, frameH, videoH);

  console.log('Burning captions...');
  execSync(
    `ffmpeg -y -i "${inputVideo}" ` +
    `-vf "${drawtext}" ` +
    `-c:v libx264 -preset ultrafast -crf 20 ` +
    `-c:a copy -movflags +faststart "${outputVideo}"`,
    { stdio: 'inherit' }
  );

  const mb = fs.statSync(outputVideo).size / 1024 / 1024;
  console.log(`\n✅ ${outputVideo} — ${mb.toFixed(1)}MB`);
}

main();
