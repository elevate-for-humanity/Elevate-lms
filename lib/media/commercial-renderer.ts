import 'server-only';

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

import { getOpenAIClient } from '@/lib/ai/openai-client';
import { getPexelsVideoClip } from '@/lib/video/pexels';
import { generateRunwayClip } from '@/lib/video/runway';
import type { CommercialBrief, CommercialPlan, CommercialScene } from '@/lib/media/commercial-plan';

export interface CommercialRenderResult {
  outputPath: string;
  durationSeconds: number;
  transcript: string;
  generatedSceneCount: number;
  stockSceneCount: number;
  tempDir: string;
}

function dimensionsFor(aspectRatio: CommercialBrief['aspectRatio']) {
  if (aspectRatio === '9:16') return { width: 720, height: 1280, runwayRatio: '720:1280' as const };
  if (aspectRatio === '1:1') return { width: 1080, height: 1080, runwayRatio: '1280:720' as const };
  return { width: 1280, height: 720, runwayRatio: '1280:720' as const };
}

async function run(command: string, args: string[], timeoutMs = 180_000) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`${command} timed out`));
    }, timeoutMs);

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk).slice(-8_000);
    });
    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${code}): ${stderr.slice(-3_000)}`));
    });
  });
}

async function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.on('close', () => {
      const value = Number.parseFloat(stdout.trim());
      resolve(Number.isFinite(value) && value > 0 ? value : 0);
    });
    child.on('error', () => resolve(0));
  });
}

async function downloadTo(url: string, filePath: string) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Unable to download media (${response.status}).`);
  await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
}

async function generateNarration(text: string, voice: CommercialBrief['voice'], outputPath: string) {
  const openai = getOpenAIClient();
  const response = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: voice as any,
    input: text,
    instructions:
      'Deliver this as a polished modern commercial voiceover. Sound human, confident, concise and persuasive. Use natural pauses and emphasis. Do not sound robotic or like a radio announcer.',
    response_format: 'mp3',
  });
  await fs.writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

function formatSrtTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
}

function wrapCaption(text: string, width = 44) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

async function acquireVisual(
  scene: CommercialScene,
  brief: CommercialBrief,
  index: number,
  outputPath: string,
): Promise<'generative' | 'stock'> {
  const canUseRunway = Boolean(process.env.RUNWAY_API_KEY);
  const wantsGenerative =
    brief.sourceMode === 'generative' ||
    (brief.sourceMode === 'hybrid' && (index === 0 || index === 1));

  if (wantsGenerative && canUseRunway) {
    try {
      const { runwayRatio } = dimensionsFor(brief.aspectRatio);
      await generateRunwayClip(
        {
          promptText: scene.visualPrompt,
          duration: scene.durationSeconds >= 8 ? 10 : 5,
          ratio: runwayRatio,
        },
        outputPath,
      );
      return 'generative';
    } catch {
      // A commercial remains renderable if the generative provider is slow,
      // rate-limited, or temporarily unavailable.
    }
  }

  const stockUrl = await getPexelsVideoClip(scene.visualQuery, {
    minDuration: 4,
    maxDuration: 30,
    perPage: 12,
    orientation: brief.aspectRatio === '9:16' ? 'portrait' : 'landscape',
  });
  if (!stockUrl) {
    throw new Error(`No usable stock or generative video was available for scene: ${scene.title}`);
  }
  await downloadTo(stockUrl, outputPath);
  return 'stock';
}

async function renderScene(
  scene: CommercialScene,
  brief: CommercialBrief,
  index: number,
  tempDir: string,
) {
  const sourcePath = path.join(tempDir, `scene-${index + 1}-source.mp4`);
  const narrationPath = path.join(tempDir, `scene-${index + 1}-voice.mp3`);
  const outputPath = path.join(tempDir, `scene-${index + 1}-rendered.mp4`);
  const headlinePath = path.join(tempDir, `scene-${index + 1}-headline.txt`);
  const subtitlePath = path.join(tempDir, `scene-${index + 1}.srt`);

  const visualSource = await acquireVisual(scene, brief, index, sourcePath);
  await generateNarration(scene.narration, brief.voice, narrationPath);
  const voiceDuration = await probeDuration(narrationPath);
  const duration = Math.max(scene.durationSeconds, voiceDuration + 0.35);
  const { width, height } = dimensionsFor(brief.aspectRatio);

  await fs.writeFile(headlinePath, scene.onScreenText, 'utf8');

  const filters = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
    'fps=30',
    'format=yuv420p',
    `drawtext=textfile=${headlinePath}:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontcolor=white:fontsize=${Math.max(25, Math.round(width / 38))}:box=1:boxcolor=black@0.42:boxborderw=14:x=(w-text_w)/2:y=${Math.max(28, Math.round(height * 0.06))}`,
  ];

  if (brief.includeCaptions) {
    const subtitle = `1\n${formatSrtTime(0)} --> ${formatSrtTime(duration)}\n${wrapCaption(scene.narration, brief.aspectRatio === '9:16' ? 30 : 48)}\n`;
    await fs.writeFile(subtitlePath, subtitle, 'utf8');
    filters.push(
      `subtitles=${subtitlePath}:force_style='FontName=DejaVu Sans,FontSize=${brief.aspectRatio === '9:16' ? 15 : 18},PrimaryColour=&H00FFFFFF,OutlineColour=&H88000000,BackColour=&H66000000,BorderStyle=3,Outline=1,Shadow=0,Alignment=2,MarginV=${brief.aspectRatio === '9:16' ? 58 : 34}'`,
    );
  }

  await run('ffmpeg', [
    '-y',
    '-stream_loop', '-1',
    '-i', sourcePath,
    '-i', narrationPath,
    '-t', duration.toFixed(2),
    '-vf', filters.join(','),
    '-map', '0:v:0',
    '-map', '1:a:0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '21',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-movflags', '+faststart',
    outputPath,
  ]);

  return { outputPath, duration, visualSource };
}

async function concatenate(scenePaths: string[], outputPath: string) {
  const listPath = `${outputPath}.txt`;
  const content = scenePaths.map((item) => `file '${item.replaceAll("'", "'\\''")}'`).join('\n');
  await fs.writeFile(listPath, content, 'utf8');
  await run('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', listPath,
    '-c', 'copy', '-movflags', '+faststart', outputPath,
  ]);
}

async function addMusic(videoPath: string, musicUrl: string, outputPath: string, duration: number) {
  const musicPath = `${outputPath}.music`;
  await downloadTo(musicUrl, musicPath);
  await run('ffmpeg', [
    '-y',
    '-i', videoPath,
    '-stream_loop', '-1',
    '-i', musicPath,
    '-filter_complex', '[1:a]volume=0.12[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]',
    '-map', '0:v:0',
    '-map', '[aout]',
    '-t', duration.toFixed(2),
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '160k',
    '-movflags', '+faststart',
    outputPath,
  ]);
}

export async function renderCommercialVideo(
  plan: CommercialPlan,
  brief: CommercialBrief,
): Promise<CommercialRenderResult> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'elevate-commercial-'));
  const scenePaths: string[] = [];
  let durationSeconds = 0;
  let generatedSceneCount = 0;
  let stockSceneCount = 0;

  for (let index = 0; index < plan.scenes.length; index += 1) {
    const rendered = await renderScene(plan.scenes[index], brief, index, tempDir);
    scenePaths.push(rendered.outputPath);
    durationSeconds += rendered.duration;
    if (rendered.visualSource === 'generative') generatedSceneCount += 1;
    else stockSceneCount += 1;
  }

  const assembledPath = path.join(tempDir, 'commercial-assembled.mp4');
  await concatenate(scenePaths, assembledPath);

  let outputPath = assembledPath;
  if (brief.musicAssetUrl) {
    const mixedPath = path.join(tempDir, 'commercial-final.mp4');
    await addMusic(assembledPath, brief.musicAssetUrl, mixedPath, durationSeconds);
    outputPath = mixedPath;
  }

  return {
    outputPath,
    durationSeconds,
    transcript: plan.scenes.map((scene) => scene.narration).join('\n\n'),
    generatedSceneCount,
    stockSceneCount,
    tempDir,
  };
}

export async function cleanupCommercialRender(tempDir: string) {
  await fs.rm(tempDir, { recursive: true, force: true });
}
