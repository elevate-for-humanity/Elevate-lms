import 'server-only';

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { createAdminClient } from '@/lib/supabase/admin';
import type { MediaStoryboard } from './media-director';
import type { InstructionalQualityEvidence } from './instructional-quality-gate';

export const MEDIA_QUALITY_GATE_VERSION = 'media-quality-v2';

const execFileAsync = promisify(execFile);
const MIN_BYTES = 100_000;
const MAX_FREEZE_SECONDS = 4;
const MAX_BLACK_SECONDS = 0.75;

export interface MediaQualityEvidence {
  gateVersion: typeof MEDIA_QUALITY_GATE_VERSION;
  bytes: number;
  actualDurationSeconds: number;
  expectedDurationSeconds: number;
  videoStreams: number;
  audioStreams: number;
  sceneChanges: number;
  longestFreezeSeconds: number;
  longestBlackSeconds: number;
  expectedSceneCount: number;
  storyboardSceneCount: number;
  captionUrl?: string;
  transcriptUrl?: string;
  provider?: string;
  providerModel?: string;
  narrationCoverage: number;
  visualEvidenceCoverage: number;
  repeatedVisualMaximum: number;
  requiredProcedurePhases: string[];
  deliveredProcedurePhases: string[];
  sourceEvidenceCoverage: number;
  exactVisualSourceCoverage: number;
  instructionalQuality: InstructionalQualityEvidence;
}

export function mediaQualityFailures(evidence: MediaQualityEvidence): string[] {
  const failures: string[] = [];
  if (evidence.gateVersion !== MEDIA_QUALITY_GATE_VERSION) failures.push('media quality evidence uses an obsolete gate version');
  const durationTolerance = Math.max(2, evidence.expectedDurationSeconds * 0.1);
  if (evidence.bytes < MIN_BYTES) failures.push(`MP4 is too small (${evidence.bytes} bytes)`);
  if (!Number.isFinite(evidence.actualDurationSeconds) || evidence.actualDurationSeconds <= 0) {
    failures.push('MP4 has no measurable duration');
  } else if (Math.abs(evidence.actualDurationSeconds - evidence.expectedDurationSeconds) > durationTolerance) {
    failures.push(
      `duration mismatch: expected ${evidence.expectedDurationSeconds.toFixed(2)}s, decoded ${evidence.actualDurationSeconds.toFixed(2)}s`,
    );
  }
  if (evidence.videoStreams < 1) failures.push('MP4 has no decodable video stream');
  if (evidence.audioStreams < 1) failures.push('MP4 has no narration/audio stream');
  if (evidence.storyboardSceneCount !== evidence.expectedSceneCount) {
    failures.push(
      `storyboard mismatch: expected ${evidence.expectedSceneCount} scenes, preserved ${evidence.storyboardSceneCount}`,
    );
  }
  if (evidence.sceneChanges < Math.max(1, evidence.expectedSceneCount - 1)) {
    failures.push(
      `insufficient visual changes: detected ${evidence.sceneChanges}, expected at least ${Math.max(1, evidence.expectedSceneCount - 1)}`,
    );
  }
  if (evidence.longestFreezeSeconds > MAX_FREEZE_SECONDS) {
    failures.push(`frozen interval ${evidence.longestFreezeSeconds.toFixed(2)}s exceeds ${MAX_FREEZE_SECONDS}s`);
  }
  if (evidence.longestBlackSeconds > MAX_BLACK_SECONDS) {
    failures.push(`blank/black interval ${evidence.longestBlackSeconds.toFixed(2)}s exceeds ${MAX_BLACK_SECONDS}s`);
  }
  if (!evidence.captionUrl) failures.push('caption URL is missing');
  if (!evidence.transcriptUrl) failures.push('transcript URL is missing');
  if (!evidence.provider) failures.push('provider evidence is missing');
  if (!evidence.providerModel) failures.push('provider model evidence is missing');
  if (evidence.narrationCoverage < 0.97) failures.push(`narration coverage ${(evidence.narrationCoverage * 100).toFixed(1)}% is below 97%`);
  if (evidence.visualEvidenceCoverage < 0.75) failures.push(`visual evidence coverage ${(evidence.visualEvidenceCoverage * 100).toFixed(1)}% is below 75%`);
  if (evidence.repeatedVisualMaximum > 3) failures.push(`one visual is repeated across ${evidence.repeatedVisualMaximum} scenes`);
  if (evidence.sourceEvidenceCoverage < 1) failures.push('one or more scenes have no persisted visual-source evidence');
  if (evidence.exactVisualSourceCoverage < 1) failures.push('one or more demonstration scenes use unverified stock imagery');
  if (evidence.instructionalQuality.instructionLeakageDetected) failures.push('narration contains internal generation instructions');
  if (evidence.instructionalQuality.objectiveCoverage < 1) failures.push('narration does not cover every stated learning objective');
  if (evidence.instructionalQuality.sceneNarrationAlignment < 0.75) failures.push('storyboard does not align with narration');
  const missingPhases = evidence.requiredProcedurePhases.filter((phase) => !evidence.deliveredProcedurePhases.includes(phase));
  if (missingPhases.length) failures.push(`missing procedure phases: ${missingPhases.join(', ')}`);
  return failures;
}

function normalizedWords(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function narrationCoverage(script: string, deliveredTranscript: string): number {
  const expected = normalizedWords(script);
  if (!expected.length) return 1;
  const delivered = new Set(normalizedWords(deliveredTranscript));
  return expected.filter((word) => delivered.has(word)).length / expected.length;
}

function longestMetric(output: string, key: 'freeze_duration' | 'black_duration'): number {
  const expression = key === 'freeze_duration'
    ? /freeze_duration:\s*([0-9.]+)/g
    : /black_duration:([0-9.]+)/g;
  return [...output.matchAll(expression)].reduce((longest, match) => Math.max(longest, Number(match[1]) || 0), 0);
}

async function requireTextAsset(url: string, label: string): Promise<string> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  const content = (await response.text()).trim();
  if (!content) throw new Error(`${label} is empty`);
  return content;
}

export function resolveCloudflareTranscriptionModel(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.AI_TRANSCRIPTION_MODEL?.trim();
  return configured?.startsWith('@cf/') ? configured : '@cf/openai/whisper';
}

export function cloudflareTranscriptionChunkSeconds(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const configured = Number.parseInt(env.AI_TRANSCRIPTION_CHUNK_SECONDS ?? '', 10);
  if (!Number.isFinite(configured)) return 240;
  return Math.min(300, Math.max(60, configured));
}

async function requireCloudflareTranscriptionCredentials(): Promise<{
  accountId: string;
  token: string;
}> {
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '';
  let token = (process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN)?.trim() ?? '';
  if (accountId && token) return { accountId, token };

  const db = createAdminClient();
  if (!accountId) {
    const { data, error } = await db.rpc('get_platform_secret', { p_key: 'CLOUDFLARE_ACCOUNT_ID' });
    if (!error && typeof data === 'string') accountId = data.trim();
  }
  if (!token) {
    const { data, error } = await db.rpc('get_platform_secret', { p_key: 'CLOUDFLARE_AI_API_TOKEN' });
    if (!error && typeof data === 'string') token = data.trim();
  }
  if (!accountId || !token) {
    throw new Error('Cloudflare rendered-audio transcription credentials are not configured');
  }
  return { accountId, token };
}

async function transcribeRenderedAudio(videoPath: string, workDir: string): Promise<string> {
  const model = resolveCloudflareTranscriptionModel();

  // Raw WAV expands long lessons enough to exceed the Workers AI request
  // boundary. Encode bounded mono MP3 segments so quality verification scales
  // with lesson duration without weakening the transcription requirement.
  const audioPattern = join(workDir, 'rendered-audio-%03d.mp3');
  await execFileAsync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', videoPath,
    '-vn', '-ac', '1', '-ar', '16000', '-codec:a', 'libmp3lame', '-b:a', '48k',
    '-f', 'segment', '-segment_time', String(cloudflareTranscriptionChunkSeconds()),
    '-reset_timestamps', '1', audioPattern,
  ], { timeout: 120_000, maxBuffer: 2_000_000 });
  const audioPaths = (await readdir(workDir))
    .filter((name) => /^rendered-audio-\d{3}\.mp3$/.test(name))
    .sort()
    .map((name) => join(workDir, name));
  if (!audioPaths.length) throw new Error('Rendered-audio compression produced no chunks');
  const { accountId, token } = await requireCloudflareTranscriptionCredentials();
  const transcriptParts: string[] = [];
  for (const [index, audioPath] of audioPaths.entries()) {
    const audio = await readFile(audioPath);
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'cf-aig-gateway-id': process.env.AI_GATEWAY_ID?.trim() || 'default',
          'Content-Type': 'audio/mpeg',
        },
        body: audio,
        signal: AbortSignal.timeout(180_000),
      },
    );
    if (!response.ok) {
      throw new Error(
        `Cloudflare rendered-audio transcription chunk ${index + 1}/${audioPaths.length} returned HTTP ${response.status}`,
      );
    }
    const payload = await response.json() as { result?: { text?: string } };
    const chunkTranscript = payload.result?.text?.trim() ?? '';
    if (!chunkTranscript) {
      throw new Error(`Rendered-audio transcription chunk ${index + 1}/${audioPaths.length} is empty`);
    }
    transcriptParts.push(chunkTranscript);
  }
  const transcript = transcriptParts.join(' ').trim();
  if (!transcript) throw new Error('Rendered-audio transcription is empty');
  return transcript;
}

export async function enforceMediaQuality(input: {
  videoUrl: string;
  expectedDurationSeconds: number;
  expectedSceneCount: number;
  sceneData: MediaStoryboard;
  provider?: string;
  providerModel?: string;
  expectedScript: string;
  instructionalQuality: InstructionalQualityEvidence;
}): Promise<MediaQualityEvidence> {
  const response = await fetch(input.videoUrl, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`MP4 returned HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const workDir = await mkdtemp(join(tmpdir(), 'elevate-media-quality-'));
  const videoPath = join(workDir, 'asset.mp4');
  try {
    await writeFile(videoPath, buffer);
    const { stdout: probeOutput } = await execFileAsync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration:stream=codec_type', '-of', 'json', videoPath,
    ], { timeout: 30_000, maxBuffer: 2_000_000 });
    const probe = JSON.parse(String(probeOutput)) as {
      format?: { duration?: string };
      streams?: Array<{ codec_type?: string }>;
    };
    const streams = probe.streams ?? [];
    const actualTranscript = await transcribeRenderedAudio(videoPath, workDir);
    const evidenceScenes = input.sceneData.scenes.filter((scene) => Boolean(scene.requiredVisualEvidence));
    const visualKeys = input.sceneData.scenes.map((scene) => scene.referenceImageUrl || scene.sourceVideoUrl || scene.action.trim().toLowerCase());
    const counts = new Map<string, number>();
    visualKeys.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
    const deliveredProcedurePhases = [...new Set(input.sceneData.scenes.map((scene) => scene.procedurePhase).filter((value): value is NonNullable<typeof value> => Boolean(value)))];
    const requiredProcedurePhases = [...new Set(input.sceneData.scenes
      .filter((scene) => Boolean(scene.requiredVisualEvidence))
      .map((scene) => scene.procedurePhase)
      .filter((value): value is NonNullable<typeof value> => Boolean(value)))];
    const sourcedScenes = input.sceneData.scenes.filter((scene) => Boolean(scene.resolvedProvider && scene.resolvedModel));
    const exactSceneTypes = new Set(['equipment_closeup', 'worked_example', 'common_mistake', 'safety_warning']);
    const exactScenes = input.sceneData.scenes.filter((scene) => scene.sceneType && exactSceneTypes.has(scene.sceneType));
    const verifiedExactScenes = exactScenes.filter((scene) =>
      ['wan', 'ltx', 'remotion'].includes(scene.resolvedProvider ?? ''),
    );

    const actualDurationSeconds = Number(probe.format?.duration ?? 0);
    // Full-frame audits are CPU-bound. Running three decoders concurrently
    // starves each process and makes valid long lessons hit the fixed timeout.
    // Audit sequentially and scale the ceiling with decoded media duration.
    const analysisTimeoutMs = Math.min(
      900_000,
      Math.max(180_000, Math.ceil(actualDurationSeconds * 2_500)),
    );
    const { stderr: sceneOutput } = await execFileAsync(
      'ffmpeg',
      ['-hide_banner', '-i', videoPath, '-filter:v', "select='gt(scene,0.12)',showinfo", '-f', 'null', '-'],
      { timeout: analysisTimeoutMs, maxBuffer: 8_000_000 },
    );
    const { stderr: freezeOutput } = await execFileAsync(
      'ffmpeg',
      ['-hide_banner', '-i', videoPath, '-vf', 'freezedetect=n=-45dB:d=2', '-an', '-f', 'null', '-'],
      { timeout: analysisTimeoutMs, maxBuffer: 8_000_000 },
    );
    const { stderr: blackOutput } = await execFileAsync(
      'ffmpeg',
      ['-hide_banner', '-i', videoPath, '-vf', 'blackdetect=d=0.3:pix_th=0.10', '-an', '-f', 'null', '-'],
      { timeout: analysisTimeoutMs, maxBuffer: 8_000_000 },
    );

    const evidence: MediaQualityEvidence = {
      gateVersion: MEDIA_QUALITY_GATE_VERSION,
      bytes: buffer.length,
      actualDurationSeconds,
      expectedDurationSeconds: input.expectedDurationSeconds,
      videoStreams: streams.filter((stream) => stream.codec_type === 'video').length,
      audioStreams: streams.filter((stream) => stream.codec_type === 'audio').length,
      sceneChanges: (String(sceneOutput).match(/pts_time:/g) ?? []).length,
      longestFreezeSeconds: longestMetric(String(freezeOutput), 'freeze_duration'),
      longestBlackSeconds: longestMetric(String(blackOutput), 'black_duration'),
      expectedSceneCount: input.expectedSceneCount,
      storyboardSceneCount: input.sceneData.scenes.length,
      captionUrl: input.sceneData.captionUrl,
      transcriptUrl: input.sceneData.transcriptUrl,
      provider: input.provider,
      providerModel: input.providerModel,
      narrationCoverage: narrationCoverage(input.expectedScript, actualTranscript),
      visualEvidenceCoverage: input.sceneData.scenes.length ? evidenceScenes.length / input.sceneData.scenes.length : 0,
      repeatedVisualMaximum: Math.max(0, ...counts.values()),
      requiredProcedurePhases,
      deliveredProcedurePhases,
      sourceEvidenceCoverage: input.sceneData.scenes.length ? sourcedScenes.length / input.sceneData.scenes.length : 0,
      exactVisualSourceCoverage: exactScenes.length ? verifiedExactScenes.length / exactScenes.length : 1,
      instructionalQuality: input.instructionalQuality,
    };
    const failures = mediaQualityFailures(evidence);
    if (failures.length) throw new Error(`Media quality gate failed: ${failures.join('; ')}`);
    const [captions, transcript] = await Promise.all([
      requireTextAsset(input.sceneData.captionUrl!, 'captions'),
      requireTextAsset(input.sceneData.transcriptUrl!, 'transcript'),
    ]);
    if (narrationCoverage(actualTranscript, captions) < 0.9) {
      throw new Error('Media quality gate failed: captions do not cover rendered narration');
    }
    if (narrationCoverage(actualTranscript, transcript) < 0.9) {
      throw new Error('Media quality gate failed: transcript does not cover rendered narration');
    }
    return evidence;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
