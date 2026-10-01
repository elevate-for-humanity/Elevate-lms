import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Metric, NarrationMetrics } from './narration-quality';

const execFileAsync = promisify(execFile);
const MAX_NARRATION_BYTES = 512 * 1024 * 1024;

type SignalSummary = {
  durationSeconds: number;
  maxVolumeDb: number;
  meanVolumeDb: number;
  unnaturalPauseCount: number;
};

function measured<T>(value: T, source: string): Metric<T> {
  return { value, measured: true, source };
}

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function repeatedTranscriptRatio(transcript: string): number {
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean);
  const seen = new Set<string>();
  let repeatedWords = 0;
  for (const sentence of sentences) {
    if (seen.has(sentence)) repeatedWords += wordCount(sentence);
    else seen.add(sentence);
  }
  return wordCount(transcript) ? repeatedWords / wordCount(transcript) : 0;
}

function pronunciationRisks(transcript: string): string[] {
  return Array.from(
    new Set(transcript.match(/https?:\/\/\S+|\{\{[^}]+\}\}|\b[A-Z_]{3,}_+[A-Z_]*\b/g) ?? []),
  ).slice(0, 20);
}

export function deriveNarrationMetrics(
  transcript: string,
  signal: SignalSummary,
): NarrationMetrics {
  const words = wordCount(transcript);
  const dynamicRangeDb = Math.max(0, signal.maxVolumeDb - signal.meanVolumeDb);
  const monotoneScore = clamp((10 - dynamicRangeDb) / 10);
  const pausesPerThirtySeconds =
    signal.unnaturalPauseCount / Math.max(1, signal.durationSeconds / 30);
  const roboticScore = clamp(monotoneScore * 0.65 + Math.min(1, pausesPerThirtySeconds) * 0.35);
  const clippedWords = signal.maxVolumeDb >= -0.5 ? 1 : 0;

  return {
    wordsPerMinute: measured(
      signal.durationSeconds > 0 ? words / (signal.durationSeconds / 60) : 0,
      'transcript+ffprobe-duration',
    ),
    roboticScore: measured(roboticScore, 'ffmpeg-dynamics+pause-cadence'),
    monotoneScore: measured(monotoneScore, 'ffmpeg-dynamic-range'),
    clippedWords: measured(clippedWords, 'ffmpeg-peak-level'),
    unnaturalPauseCount: measured(signal.unnaturalPauseCount, 'ffmpeg-silencedetect'),
    pronunciationFailures: measured(pronunciationRisks(transcript), 'transcript-pronounceability'),
    repeatedAudioRatio: measured(
      repeatedTranscriptRatio(transcript),
      'delivered-transcript-repeat-analysis',
    ),
    durationSeconds: measured(signal.durationSeconds, 'ffprobe'),
  };
}

function requiredNumber(output: string, pattern: RegExp, label: string): number {
  const match = pattern.exec(output);
  const value = match ? Number(match[1]) : Number.NaN;
  if (!Number.isFinite(value)) throw new Error(`NARRATION_ANALYSIS_${label}_MISSING`);
  return value;
}

function assertTrustedNarrationUrl(audioUrl: string): URL {
  const url = new URL(audioUrl);
  const configuredBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!configuredBase) throw new Error('NARRATION_ANALYSIS_SUPABASE_URL_REQUIRED');
  const storageOrigin = new URL(configuredBase).origin;
  if (url.origin !== storageOrigin || !url.pathname.startsWith('/storage/v1/object/')) {
    throw new Error('NARRATION_ANALYSIS_UNTRUSTED_AUDIO_URL');
  }
  return url;
}

export async function analyzeNarrationAudio(input: {
  audioUrl: string;
  transcript: string;
  deliveredMp4?: boolean;
}): Promise<NarrationMetrics> {
  const url = assertTrustedNarrationUrl(input.audioUrl);
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(120_000),
  });
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (!response.ok || !(contentType.startsWith('audio/') || (input.deliveredMp4 && contentType.startsWith('video/')))) {
    throw new Error(
      `NARRATION_ANALYSIS_AUDIO_FETCH_FAILED:${response.status}:${contentType || 'unknown'}`,
    );
  }
  const audio = Buffer.from(await response.arrayBuffer());
  if (!audio.length || audio.length > MAX_NARRATION_BYTES) {
    throw new Error(`NARRATION_ANALYSIS_AUDIO_SIZE_INVALID:${audio.length}`);
  }

  const directory = await mkdtemp(path.join(tmpdir(), 'ultimate-narration-'));
  const audioPath = path.join(directory, 'narration.mp3');
  try {
    await writeFile(audioPath, audio);
    const [{ stdout: durationOutput }, { stderr: signalOutput }] = await Promise.all([
      execFileAsync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          audioPath,
        ],
        { timeout: 30_000, maxBuffer: 100_000 },
      ),
      execFileAsync(
        'ffmpeg',
        [
          '-hide_banner',
          '-i',
          audioPath,
          '-af',
          'silencedetect=noise=-40dB:d=1.5,volumedetect',
          '-f',
          'null',
          '-',
        ],
        { timeout: 120_000, maxBuffer: 2_000_000 },
      ),
    ]);
    const durationSeconds = Number(String(durationOutput).trim());
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      throw new Error('NARRATION_ANALYSIS_DURATION_INVALID');
    }
    const output = String(signalOutput);
    const maxVolumeDb = requiredNumber(output, /max_volume:\s*(-?[\d.]+)\s*dB/i, 'PEAK');
    const meanVolumeDb = requiredNumber(output, /mean_volume:\s*(-?[\d.]+)\s*dB/i, 'MEAN');
    const unnaturalPauseCount = Array.from(output.matchAll(/silence_start:\s*[\d.]+/gi)).length;
    return deriveNarrationMetrics(input.transcript, {
      durationSeconds,
      maxVolumeDb,
      meanVolumeDb,
      unnaturalPauseCount,
    });
  } finally {
    await rm(directory, { recursive: true, force: true }).catch(() => {});
  }
}
