import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Metric, NarrationMetrics } from './narration-quality';
import { getElevateMediaStorageConfig, getSignedElevateMediaUrl } from '../../storage/elevate-media-storage';

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

function trustedHttpsUrl(value?: string): URL | null {
  try {
    const url = new URL(value ?? '');
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash ? url : null;
  } catch { return null; }
}

function assertTrustedNarrationUrl(audioUrl: string): { url: URL; mediaKey?: string } {
  const url = trustedHttpsUrl(audioUrl);
  if (!url) throw new Error('NARRATION_ANALYSIS_UNTRUSTED_AUDIO_URL');
  const supabase = trustedHttpsUrl(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  if (supabase && url.origin === supabase.origin &&
      /^\/storage\/v1\/object\/(public|sign)\/course[-_]videos\//.test(url.pathname)) {
    return { url };
  }
  // Use the uploader's configuration, including its supported legacy aliases.
  // S3 signs either endpoint/bucket/key or bucket.endpoint/key. Both identify
  // the same configured bucket; no provider-wide hostname suffix is trusted.
  const config = getElevateMediaStorageConfig();
  const endpoint = trustedHttpsUrl(config.endpoint);
  const publicBase = trustedHttpsUrl(config.publicUrl);
  let encodedKey: string | undefined;
  if (endpoint && config.bucket) {
    const prefix = endpoint.pathname.replace(/\/$/, '') + '/' + encodeURIComponent(config.bucket) + '/';
    const virtual = new URL(endpoint);
    virtual.hostname = `${config.bucket}.${endpoint.hostname}`;
    const virtualPrefix = endpoint.pathname.replace(/\/$/, '') + '/';
    if (url.origin === endpoint.origin && url.pathname.startsWith(prefix)) {
      encodedKey = url.pathname.slice(prefix.length);
    } else if (url.origin === virtual.origin && url.pathname.startsWith(virtualPrefix)) {
      encodedKey = url.pathname.slice(virtualPrefix.length);
    }
  }
  if (encodedKey === undefined && publicBase && config.bucket && url.origin === publicBase.origin) {
    const prefix = publicBase.pathname.replace(/\/$/, '') + '/';
    if (url.pathname.startsWith(prefix)) encodedKey = url.pathname.slice(prefix.length);
  }
  let mediaKey: string;
  try { mediaKey = decodeURIComponent(encodedKey ?? ''); }
  catch { throw new Error('NARRATION_ANALYSIS_UNTRUSTED_AUDIO_URL'); }
  if (!mediaKey.startsWith('course-videos/') || !mediaKey.slice('course-videos/'.length) ||
      mediaKey.split('/').some(part => part === '.' || part === '..' || !part) ||
      [...mediaKey].some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 || character === '\\')) {
    throw new Error('NARRATION_ANALYSIS_UNTRUSTED_AUDIO_URL');
  }
  return { url, mediaKey };
}

export async function analyzeNarrationAudio(input: {
  audioUrl: string;
  transcript: string;
  deliveredMp4?: boolean;
  expectedMediaSha256?: string;
}): Promise<NarrationMetrics> {
  const reference = assertTrustedNarrationUrl(input.audioUrl);
  let url = reference.url;
  if (reference.mediaKey) {
    // Checkpoints outlive signed URLs. Renew access, not narration or rendering.
    const renewed = await getSignedElevateMediaUrl(reference.mediaKey, 3600);
    if (!renewed) throw new Error('NARRATION_ANALYSIS_MEDIA_SIGNING_FAILED');
    const checked = assertTrustedNarrationUrl(renewed);
    if (checked.mediaKey !== reference.mediaKey) throw new Error('NARRATION_ANALYSIS_MEDIA_REFERENCE_MISMATCH');
    url = checked.url;
  }
  const response = await fetch(url, {
    cache: 'no-store',
    redirect: 'error',
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
  if (input.expectedMediaSha256 &&
      createHash('sha256').update(audio).digest('hex') !== input.expectedMediaSha256) {
    throw new Error('NARRATION_ANALYSIS_MEDIA_CHECKSUM_MISMATCH');
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
