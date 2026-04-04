/**
 * Runway Gen4.5 video generation client.
 *
 * Policy: ALL lesson video generation goes through this module.
 * The course generator (seed-course-from-blueprint) calls generateRunwayClip()
 * for each lesson segment. Never call the Runway API directly from other files.
 *
 * Flow per lesson:
 *   1. GPT-4o writes a visual prompt per segment from lesson content
 *   2. generateRunwayClip() submits to Runway Gen4.5, polls until done
 *   3. Clips are downloaded and stitched with ffmpeg
 *   4. OpenAI TTS narration is laid over the stitched video
 */

import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RUNWAY_API   = 'https://api.dev.runwayml.com/v1';
const RUNWAY_MODEL = 'gen4.5';
const API_VERSION  = '2024-11-06';

function headers() {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) throw new Error('RUNWAY_API_KEY is not set');
  return {
    'Authorization': `Bearer ${key}`,
    'X-Runway-Version': API_VERSION,
    'Content-Type': 'application/json',
  };
}

export interface RunwayClipOptions {
  /** Visual description of what should appear in the clip */
  promptText: string;
  /** 5 or 10 seconds */
  duration?: 5 | 10;
  /** Output resolution ratio */
  ratio?: '1280:720' | '1920:1080' | '720:1280';
}

export interface RunwayTask {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
  failure?: string;
}

/** Submit a text-to-video generation task. Returns the task ID. */
export async function submitRunwayTask(opts: RunwayClipOptions): Promise<string> {
  const res = await fetch(`${RUNWAY_API}/text_to_video`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      model:      RUNWAY_MODEL,
      promptText: opts.promptText,
      duration:   opts.duration ?? 10,
      ratio:      opts.ratio    ?? '1280:720',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Runway submit failed (${res.status}): ${err}`);
  }

  const data = await res.json() as { id: string };
  return data.id;
}

/** Poll a task until SUCCEEDED or FAILED. Returns the output video URL. */
export async function pollRunwayTask(
  taskId: string,
  timeoutMs = 300_000,
  intervalMs = 5_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs));

    const res = await fetch(`${RUNWAY_API}/tasks/${taskId}`, {
      headers: headers(),
    });

    if (!res.ok) throw new Error(`Runway poll failed (${res.status})`);

    const task = await res.json() as RunwayTask;

    if (task.status === 'SUCCEEDED') {
      const url = task.output?.[0];
      if (!url) throw new Error('Runway task succeeded but no output URL');
      return url;
    }

    if (task.status === 'FAILED') {
      throw new Error(`Runway task failed: ${task.failure ?? 'unknown'}`);
    }

    process.stdout.write('.');
  }

  throw new Error(`Runway task ${taskId} timed out after ${timeoutMs / 1000}s`);
}

/** Generate a single clip and download it to outputPath. */
export async function generateRunwayClip(
  opts: RunwayClipOptions,
  outputPath: string,
): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const taskId = await submitRunwayTask(opts);
  process.stdout.write(`  Runway task ${taskId} `);

  const videoUrl = await pollRunwayTask(taskId);
  process.stdout.write(' done\n');

  // Download
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(`Failed to download clip: ${res.status}`);
  await fs.writeFile(outputPath, Buffer.from(await res.arrayBuffer()));
}

/**
 * Build a visual prompt for a lesson segment.
 * Called by the course generator — keeps prompt logic centralised here.
 */
export function buildVisualPrompt(
  lessonTitle: string,
  segment: string,
  imagePrompt?: string,
): string {
  const base = imagePrompt
    ? imagePrompt
    : `${lessonTitle}, professional training environment`;

  const cinematic = 'cinematic lighting, shallow depth of field, 4K, professional';

  const segmentStyle: Record<string, string> = {
    intro:       'wide establishing shot',
    concept:     'close-up detail shot',
    visual:      'overhead or diagram-style view',
    application: 'hands-on demonstration',
    wrapup:      'confident professional, clean background',
  };

  const style = segmentStyle[segment] ?? 'professional training shot';
  return `${base}, ${style}, ${cinematic}`;
}

/**
 * Stitch multiple clip files into one video using ffmpeg concat.
 */
export function stitchClips(clipPaths: string[], outputPath: string): void {
  const listFile = outputPath + '.list.txt';
  fssync.writeFileSync(listFile, clipPaths.map(p => `file '${p}'`).join('\n'));
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:v libx264 -preset fast -crf 20 "${outputPath}"`,
    { stdio: 'pipe' },
  );
  fssync.unlinkSync(listFile);
}

/**
 * Lay an audio track over a video, looping the video if shorter than audio.
 */
export function muxAudioOverVideo(
  videoPath: string,
  audioPath: string,
  outputPath: string,
): void {
  execSync(
    `ffmpeg -y -stream_loop -1 -i "${videoPath}" -i "${audioPath}" ` +
    `-c:v libx264 -preset fast -crf 20 -c:a aac -b:a 128k -shortest "${outputPath}"`,
    { stdio: 'pipe' },
  );
}
