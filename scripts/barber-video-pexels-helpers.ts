/**
 * Pexels b-roll helpers for Prestige Elevation barber lesson videos.
 * Free API: https://www.pexels.com/api/
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { getPexelsVideoClip } from '../lib/video/pexels';

const W = 1920;
const H = 1080;

export const PEXELS_SEGMENTS = new Set(['visual', 'application']);

export function pexelsSearchForLesson(lessonTitle: string, segment: string): string {
  const t = lessonTitle.toLowerCase();
  if (/infection|sanit|disinfect|osha|blood|safety/.test(t)) return 'barbershop sanitation disinfecting';
  if (/haircut|fade|clipper|cutting|trim/.test(t)) return 'barber haircut clippers fade';
  if (/shav|beard|razor/.test(t)) return 'barber shave straight razor';
  if (/chemical|color|perm/.test(t)) return 'hair salon chemical treatment';
  if (/scalp|hair science|dandruff/.test(t)) return 'barber scalp analysis';
  if (/business|client|consult/.test(t)) return 'barbershop client consultation';
  if (/exam|board|license/.test(t)) return 'barber student training professional';
  if (/tool|equipment|ergonomic/.test(t)) return 'barber tools professional';
  if (segment === 'application') return 'professional barber shop work';
  if (segment === 'visual') return 'barber technique training';
  return `barber ${lessonTitle.split(' ').slice(0, 3).join(' ')}`;
}

export async function downloadPexelsClip(url: string, destPath: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Pexels download failed (${res.status})`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

export async function fetchLessonPexelsClip(
  lessonTitle: string,
  segment: string,
  destPath: string,
): Promise<boolean> {
  if (!process.env.PEXELS_API_KEY?.trim()) return false;
  const query = pexelsSearchForLesson(lessonTitle, segment);
  const url = await getPexelsVideoClip(query, { minDuration: 3, maxDuration: 60, perPage: 12 });
  if (!url) return false;
  await downloadPexelsClip(url, destPath);
  return fs.existsSync(destPath) && fs.statSync(destPath).size > 10_000;
}

export function buildSegmentSlidePlusPexels(
  slidePng: string,
  pexelsMp4: string,
  audioMp3: string,
  duration: number,
  outPath: string,
): void {
  const slideW = Math.round(W * 0.42);
  const videoW = W - slideW;
  const filter = [
    `[1:v]scale=${videoW}:${H}:force_original_aspect_ratio=increase,crop=${videoW}:${H},setpts=PTS-STARTPTS[bg]`,
    `[0:v]scale=${slideW}:${H}[sl]`,
    `[sl][bg]hstack=inputs=2,format=yuv420p,fade=in:0:12,fade=out:st=${Math.max(0, duration - 0.5)}:d=0.5[v]`,
  ].join(';');
  execSync(
    `ffmpeg -y -loop 1 -i "${slidePng}" -stream_loop -1 -i "${pexelsMp4}" -i "${audioMp3}" ` +
      `-filter_complex "${filter}" -map "[v]" -map 2:a ` +
      `-c:v libx264 -preset fast -crf 20 -c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${duration} -movflags +faststart -shortest "${outPath}"`,
    { stdio: 'pipe', maxBuffer: 50 * 1024 * 1024 },
  );
}

export function buildSegmentSlideOnly(
  slidePng: string,
  audioMp3: string,
  duration: number,
  outPath: string,
): void {
  execSync(
    `ffmpeg -y -loop 1 -i "${slidePng}" -i "${audioMp3}" ` +
      `-vf "scale=${W}:${H},format=yuv420p,fade=in:0:15,fade=out:st=${Math.max(0, duration - 0.5)}:d=0.5" ` +
      `-c:v libx264 -preset fast -crf 20 ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-t ${duration} -movflags +faststart "${outPath}"`,
    { stdio: 'pipe' },
  );
}
