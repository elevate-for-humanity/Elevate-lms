import 'server-only';

import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import type { MediaStoryboard } from './media-director';

const execFileAsync = promisify(execFile);
const MIN_BYTES = 100_000;
const MAX_FREEZE_SECONDS = 4;
const MAX_BLACK_SECONDS = 2;

export interface MediaQualityEvidence {
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
}

export function mediaQualityFailures(evidence: MediaQualityEvidence): string[] {
  const failures: string[] = [];
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
  const missingPhases = evidence.requiredProcedurePhases.filter((phase) => !evidence.deliveredProcedurePhases.includes(phase));
  if (missingPhases.length) failures.push(`missing procedure phases: ${missingPhases.join(', ')}`);
  return failures;
}

function normalizedWords(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function narrationCoverage(script: string, storyboard: MediaStoryboard): number {
  const expected = normalizedWords(script);
  if (!expected.length) return 1;
  const delivered = new Set(normalizedWords(storyboard.scenes.map((scene) => scene.dialogue || scene.action).join(' ')));
  return expected.filter((word) => delivered.has(word)).length / expected.length;
}

function longestMetric(output: string, key: 'freeze_duration' | 'black_duration'): number {
  const expression = key === 'freeze_duration'
    ? /freeze_duration:\s*([0-9.]+)/g
    : /black_duration:([0-9.]+)/g;
  return [...output.matchAll(expression)].reduce((longest, match) => Math.max(longest, Number(match[1]) || 0), 0);
}

async function requireTextAsset(url: string, label: string): Promise<void> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
  const content = (await response.text()).trim();
  if (!content) throw new Error(`${label} is empty`);
}

export async function enforceMediaQuality(input: {
  videoUrl: string;
  expectedDurationSeconds: number;
  expectedSceneCount: number;
  sceneData: MediaStoryboard;
  provider?: string;
  providerModel?: string;
  expectedScript: string;
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
    const evidenceScenes = input.sceneData.scenes.filter((scene) => Boolean(scene.requiredVisualEvidence));
    const visualKeys = input.sceneData.scenes.map((scene) => scene.referenceImageUrl || scene.sourceVideoUrl || scene.action.trim().toLowerCase());
    const counts = new Map<string, number>();
    visualKeys.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
    const deliveredProcedurePhases = [...new Set(input.sceneData.scenes.map((scene) => scene.procedurePhase).filter((value): value is NonNullable<typeof value> => Boolean(value)))];
    const requiredProcedurePhases = [...new Set(input.sceneData.scenes.map((scene) => scene.procedurePhase).filter((value): value is NonNullable<typeof value> => Boolean(value)))];

    const [{ stderr: sceneOutput }, { stderr: freezeOutput }, { stderr: blackOutput }] = await Promise.all([
      execFileAsync('ffmpeg', ['-hide_banner', '-i', videoPath, '-filter:v', "select='gt(scene,0.12)',showinfo", '-f', 'null', '-'], { timeout: 120_000, maxBuffer: 8_000_000 }),
      execFileAsync('ffmpeg', ['-hide_banner', '-i', videoPath, '-vf', 'freezedetect=n=-45dB:d=2', '-an', '-f', 'null', '-'], { timeout: 120_000, maxBuffer: 8_000_000 }),
      execFileAsync('ffmpeg', ['-hide_banner', '-i', videoPath, '-vf', 'blackdetect=d=0.3:pix_th=0.10', '-an', '-f', 'null', '-'], { timeout: 120_000, maxBuffer: 8_000_000 }),
    ]);

    const evidence: MediaQualityEvidence = {
      bytes: buffer.length,
      actualDurationSeconds: Number(probe.format?.duration ?? 0),
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
      narrationCoverage: narrationCoverage(input.expectedScript, input.sceneData),
      visualEvidenceCoverage: input.sceneData.scenes.length ? evidenceScenes.length / input.sceneData.scenes.length : 0,
      repeatedVisualMaximum: Math.max(0, ...counts.values()),
      requiredProcedurePhases,
      deliveredProcedurePhases,
    };
    const failures = mediaQualityFailures(evidence);
    if (failures.length) throw new Error(`Media quality gate failed: ${failures.join('; ')}`);
    await Promise.all([
      requireTextAsset(input.sceneData.captionUrl!, 'captions'),
      requireTextAsset(input.sceneData.transcriptUrl!, 'transcript'),
    ]);
    return evidence;
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
