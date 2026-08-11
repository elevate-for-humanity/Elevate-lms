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

async function acquireVisual(
  scene: CommercialScene,
  brief: CommercialBrief,
  index: number,
  outputPath: string,
): Promise<'generative' | 'stock'> {
  const canUseRunway = Boolean(process.env.RUNWAY_API_KEY);
  // Hybrid intentionally spends generative compute on the opening and CTA shots;
  // the middle stays fast, stable, and economical with licensed stock discovery.
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
      // Commercial rendering must remain useful when a generative provider is
      // unavailable, rate-limited, or slower than the web request budget.
    }
  }

  const stockUrl = await getPexelsVideoClip(scene.visualQuery, {
    minDuration: 4,
    maxDuration: 30,
    perPage: 12,
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
  const captionPath = path.join(tempDir, `scene-${index + 1}-caption.txt`);

  const visualSource = await acquireVisual(scene, brief, index, sourcePath);
  await generateNarration(scene.narration, brief.voice, narrationPath);
  const voiceDuration = await probeDuration(narrationPath);
  const duration = Math.max(scene.durationSeconds, voiceDuration + 0.35);
  const { width, height } = dimensionsFor(brief.aspectRatio);

  const filters = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase`,
    `crop=${width}:${height}`,
    'fps=30',
    'format=yuv420p',
  ];

  if (brief.includeCaptions) {
    await fs.writeFile(captionPath, scene.onScreenText, 'utf8');
    filters.push(
      `drawtext=textfile=${captionPath}:fontcolor=white:fontsize=${Math.max(28, Math.round(width / 32))}:font='DejaVu Sans':box=1:boxcolor=black@0.58:boxborderw=18:x=(w-text_w)/2:y=h-text_h-${Math.max(44, Math.round(height * 0.08))}`,
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
