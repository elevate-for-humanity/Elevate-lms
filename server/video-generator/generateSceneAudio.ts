import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import type { LessonSceneDraft, VoiceName, SceneAudioAsset } from './types';

const CHUNK_SIZE = 4000;

function chunkText(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > CHUNK_SIZE && current) { chunks.push(current.trim()); current = s; }
    else current += s;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function ttsChunk(text: string, voice: string, apiKey: string): Promise<Buffer> {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1-hd', input: text, voice, speed: 1.0, response_format: 'mp3' }),
  });
  if (!res.ok) throw new Error(`TTS API error: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function probeDuration(audioPath: string): number {
  const out = execSync(
    `ffprobe -v quiet -print_format json -show_format "${audioPath}"`,
    { encoding: 'utf-8' },
  );
  return parseFloat(JSON.parse(out).format.duration);
}

export async function generateSceneAudio(
  scene: LessonSceneDraft,
  voice: VoiceName,
  outputDir: string,
): Promise<SceneAudioAsset> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  const audioPath = path.join(outputDir, `${scene.id}.mp3`);

  const chunks = chunkText(scene.narration);
  const buffers = await Promise.all(chunks.map(c => ttsChunk(c, voice, apiKey)));
  await fs.writeFile(audioPath, Buffer.concat(buffers));

  const durationSeconds = probeDuration(audioPath);
  return { sceneId: scene.id, audioPath, durationSeconds };
}

export async function generateAllSceneAudio(
  scenes: LessonSceneDraft[],
  voice: VoiceName,
  outputDir: string,
): Promise<SceneAudioAsset[]> {
  await fs.mkdir(outputDir, { recursive: true });
  const results: SceneAudioAsset[] = [];
  for (const scene of scenes) {
    const asset = await generateSceneAudio(scene, voice, outputDir);
    console.log(`  🎙 ${scene.id}: ${asset.durationSeconds.toFixed(1)}s`);
    results.push(asset);
  }
  return results;
}
