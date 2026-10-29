import 'server-only';
import {independentSpeechWindows} from './independent-speech-windows.mjs';
import {reportCourseProgress} from '../ultimate-course-builder/worker/progress-watch.mjs';
import { narrationCoverageSeverity, verifiedTeachingPhotoScene } from '../ultimate-course-builder/instructional/approved-delivery.mjs';
import { captionSampleGroups, captionWordCoverage, charcoalPixelsMatch } from '../ultimate-course-builder/instructional/approved-frame-checks.mjs';
import {quoteStartSeconds} from '../ultimate-course-builder/instructional/picture-timeline.mjs';
import { teachingPresentation } from '@/lib/ultimate-course-builder/instructional/teaching-presentation';
import { createHash } from 'node:crypto';

import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { promisify } from 'node:util';

import { createAdminClient } from '@/lib/supabase/admin';
import type { MediaStoryboard } from './media-director';
import type { InstructionalQualityEvidence } from './instructional-quality-gate';
import { configuredNarrationProvider } from './edge-tts';
import { MIN_TITLE_WORD_COVERAGE, readEncodedTitle } from './title-readability.mjs';
import { PREMIUM_TITLE_LAYOUT } from '../../remotion-src/premium-title-layout.mjs';

export const MEDIA_QUALITY_GATE_VERSION = 'media-quality-v9';

const execFileAsync = promisify(execFile);
const MIN_BYTES = 100_000;
const MAX_FREEZE_SECONDS = 4;
const MAX_BLACK_SECONDS = 0.75;
// Cloud transcription is evidence that narration is present, not a verbatim
// oracle. Technical acronyms and product names routinely vary in ASR output.

export interface MediaQualityEvidence {
  approvedPresentationInspection?: {pass: boolean; backgrounds: Array<{sceneId:string;passed:boolean}>; captions: Array<{sceneId:string;width:number;time:number;expected:string;decoded:string;wordCoverage:number}>};
  mediaSha256?: string;
  actualTranscript?: string;
  readability?: Array<{ scene: number; width: number; wordCoverage: number; ocrMode?: 'full-frame' | 'title-region' }>;
  teachingVisualEvidence?: Array<{sceneId:string;step:number;width:number;time:number;expected:string;decoded:string;wordCoverage:number;ocrMode?:'sparse'|'block'|'block-upscaled'}>;
  narrationCoverageAdvisory?: boolean;
  warnings?: string[];
  sceneNarrationEvidence?: Array<{sceneId:string;startSeconds:number;endSeconds:number;actualTranscript:string;coverage:number}>;
  gateVersion: typeof MEDIA_QUALITY_GATE_VERSION;
  bytes: number;
  actualDurationSeconds: number;
  expectedDurationSeconds: number;
  videoStreams: number;
  audioStreams: number;
  width: number;
  height: number;
  openingStillUrl?: string;
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
  backwardTimelineJumpDetected: boolean;
  repeatedTemporalSequenceCount: number;
  temporalReplayMatches?: Array<{priorStartSeconds:number;replayStartSeconds:number;durationSeconds:number}>;
  requiredProcedurePhases: string[];
  deliveredProcedurePhases: string[];
  sourceEvidenceCoverage: number;
  exactVisualSourceCoverage: number;
  licenseEvidenceCoverage: number;
  sourceProviders: string[];
  licenseEvidenceUrls: string[];
  instructionalQuality: InstructionalQualityEvidence;
  narrationProviderClass?: 'professional' | 'diagnostic' | 'unknown';
}

export function mediaQualityFailures(evidence: MediaQualityEvidence): string[] {
  const failures: string[] = [];
  if (evidence.gateVersion !== MEDIA_QUALITY_GATE_VERSION)
    failures.push('media quality evidence uses an obsolete gate version');
  const durationTolerance = Math.max(2, evidence.expectedDurationSeconds * 0.1);
  if (evidence.bytes < MIN_BYTES) failures.push(`MP4 is too small (${evidence.bytes} bytes)`);
  if (!Number.isFinite(evidence.actualDurationSeconds) || evidence.actualDurationSeconds <= 0) {
    failures.push('MP4 has no measurable duration');
  } else if (
    Math.abs(evidence.actualDurationSeconds - evidence.expectedDurationSeconds) > durationTolerance
  ) {
    failures.push(
      `duration mismatch: expected ${evidence.expectedDurationSeconds.toFixed(2)}s, decoded ${evidence.actualDurationSeconds.toFixed(2)}s`,
    );
  }
  if (evidence.videoStreams < 1) failures.push('MP4 has no decodable video stream');
  if (evidence.audioStreams < 1) failures.push('MP4 has no narration/audio stream');
  // HD 720p is an acceptable delivery format. Resolution alone must not reject
  // an otherwise clear, teachable lesson; instructional defects are enforced below.
  if (evidence.width < 1280 || evidence.height < 720) {
    failures.push(`video resolution ${evidence.width}x${evidence.height} is below 1280x720`);
  }
  if (!evidence.openingStillUrl) failures.push('photographic opening still is missing');
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
    failures.push(
      `frozen interval ${evidence.longestFreezeSeconds.toFixed(2)}s exceeds ${MAX_FREEZE_SECONDS}s`,
    );
  }
  if (evidence.longestBlackSeconds > MAX_BLACK_SECONDS) {
    failures.push(
      `blank/black interval ${evidence.longestBlackSeconds.toFixed(2)}s exceeds ${MAX_BLACK_SECONDS}s`,
    );
  }
  if (!evidence.captionUrl) failures.push('caption URL is missing');
  if (!evidence.transcriptUrl) failures.push('transcript URL is missing');
  if (!evidence.provider) failures.push('provider evidence is missing');
  if (!evidence.providerModel) failures.push('provider model evidence is missing');
  if (evidence.narrationProviderClass !== 'professional')
    failures.push('narration uses a robotic/diagnostic or unverified voice provider');
  if (narrationCoverageSeverity(evidence.narrationCoverage, evidence.narrationCoverageAdvisory === true) === 'error')
    failures.push(
      `narration coverage ${(evidence.narrationCoverage * 100).toFixed(1)}% is below ${evidence.narrationCoverageAdvisory ? '75' : '90'}%`,
    );
  if (evidence.visualEvidenceCoverage < 0.75)
    failures.push(
      `visual evidence coverage ${(evidence.visualEvidenceCoverage * 100).toFixed(1)}% is below 75%`,
    );
  if (evidence.repeatedVisualMaximum > 3)
    failures.push(`one visual is repeated across ${evidence.repeatedVisualMaximum} scenes`);
  // Preserve replay findings as review evidence rather than an unconditional
  // publication blocker: temporal similarity can be intentional instructional
  // reuse and does not, by itself, establish a corrupt encoded timeline.
  // Structural defects (freeze, black frames, missing media, captions, etc.)
  // still fail closed through the independent checks above.
  if (evidence.backwardTimelineJumpDetected) {
    evidence.warnings ??= [];
    evidence.warnings.push(
      `temporal replay review: ${evidence.repeatedTemporalSequenceCount} similar moving sequence(s); verify intended instructional reuse`,
    );
  }
  if (evidence.sourceEvidenceCoverage < 1)
    failures.push('one or more scenes have no persisted visual-source evidence');
  if (evidence.exactVisualSourceCoverage < 1)
    failures.push('one or more demonstration scenes use unverified stock imagery');
  if (evidence.licenseEvidenceCoverage < 1) {
    evidence.warnings ??= [];
    evidence.warnings.push(
      'per-scene license metadata is incomplete; approved course-source provenance was retained',
    );
  }
  if (evidence.instructionalQuality.instructionLeakageDetected)
    failures.push('narration contains internal generation instructions');
  if (evidence.instructionalQuality.objectiveCoverage < 1)
    failures.push('narration does not cover every stated learning objective');
  if (evidence.instructionalQuality.sceneNarrationAlignment < 0.75)
    failures.push('storyboard does not align with narration');
  const missingPhases = evidence.requiredProcedurePhases.filter(
    (phase) => !evidence.deliveredProcedurePhases.includes(phase),
  );
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
  const expression =
    key === 'freeze_duration' ? /freeze_duration:\s*([0-9.]+)/g : /black_duration:([0-9.]+)/g;
  return [...output.matchAll(expression)].reduce(
    (longest, match) => Math.max(longest, Number(match[1]) || 0),
    0,
  );
}

/** Parse FFmpeg event stream sequentially; EOF freezes remain evidence. */
export function parseFreezeIntervals(output: string, durationSeconds: number): Array<{start:number;end:number}> {
  const events = [...output.matchAll(/freeze_(start|end):\s*([0-9]+(?:\.[0-9]+)?)/g)];
  const intervals: Array<{start:number;end:number}> = [];
  let start: number | null = null;
  for (const match of events) {
    const time = Number(match[2]);
    if (!Number.isFinite(time) || time < 0 || time > durationSeconds + 0.25)
      throw new Error('MEDIA_FREEZE_TIMESTAMP_INVALID');
    if (match[1] === 'start') {
      if (start !== null) throw new Error('MEDIA_FREEZE_OVERLAPPING_STARTS');
      start = time;
    } else {
      if (start === null || time < start) throw new Error('MEDIA_FREEZE_END_WITHOUT_START');
      intervals.push({start,end:time});
      start = null;
    }
  }
  if (start !== null) {
    if (!Number.isFinite(durationSeconds) || durationSeconds < start)
      throw new Error('MEDIA_FREEZE_UNCLOSED_INVALID_DURATION');
    intervals.push({start,end:durationSeconds});
  }
  return intervals;
}

function frameDifference(a: Buffer, b: Buffer): number {
  const length = Math.min(a.length, b.length);
  if (!length) return Number.POSITIVE_INFINITY;
  let total = 0;
  for (let index = 0; index < length; index += 1) total += Math.abs(a[index] - b[index]);
  return total / length;
}

async function detectBackwardTimelineReplay(
  videoPath: string,
  workDir: string,
): Promise<{ backwardTimelineJumpDetected: boolean; repeatedTemporalSequenceCount: number; temporalReplayMatches: Array<{priorStartSeconds:number;replayStartSeconds:number;durationSeconds:number}> }> {
  const width = 32;
  const height = 18;
  const frameSize = width * height;
  const samplePath = join(workDir, 'temporal-audit-gray.raw');
  await execFileAsync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      videoPath,
      '-vf',
      `fps=1,scale=${width}:${height}:flags=area,format=gray`,
      '-an',
      '-f',
      'rawvideo',
      samplePath,
    ],
    { timeout: 180_000, maxBuffer: 2_000_000 },
  );
  const raw = await readFile(samplePath);
  const frames: Buffer[] = [];
  for (let offset = 0; offset + frameSize <= raw.length; offset += frameSize) {
    frames.push(raw.subarray(offset, offset + frameSize));
  }
  if (frames.length < 12) {
    return { backwardTimelineJumpDetected: false, repeatedTemporalSequenceCount: 0, temporalReplayMatches: [] };
  }

  const sequenceLength = 4;
  const minimumGap = 8;
  const similarityThreshold = 3.5;
  const minimumMotion = 4;
  let repeatedTemporalSequenceCount = 0;
  const temporalReplayMatches: Array<{priorStartSeconds:number;replayStartSeconds:number;durationSeconds:number}> = [];

  for (let current = minimumGap; current <= frames.length - sequenceLength; current += 1) {
    for (let prior = 0; prior <= current - minimumGap; prior += 1) {
      let matches = true;
      for (let step = 0; step < sequenceLength; step += 1) {
        if (frameDifference(frames[prior + step], frames[current + step]) > similarityThreshold) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;

      let motion = 0;
      for (let step = 0; step < sequenceLength - 1; step += 1) {
        motion = Math.max(motion, frameDifference(frames[prior + step], frames[prior + step + 1]));
      }
      if (motion < minimumMotion) continue;

      repeatedTemporalSequenceCount += 1;
      // Keep exact one-frame-per-second locations for source-timeline comparison.
      // These matches indicate visual similarity; they do not by themselves
      // establish the root cause of a backwards timebase jump.
      temporalReplayMatches.push({priorStartSeconds:prior,replayStartSeconds:current,durationSeconds:sequenceLength});
      current += sequenceLength - 1;
      break;
    }
  }

  return {
    backwardTimelineJumpDetected: repeatedTemporalSequenceCount > 0,
    repeatedTemporalSequenceCount,
    temporalReplayMatches,
  };
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

export function cloudflareTranscriptionChunkSeconds(env: NodeJS.ProcessEnv = process.env): number {
  const configured = Number.parseInt(env.AI_TRANSCRIPTION_CHUNK_SECONDS ?? '', 10);
  if (!Number.isFinite(configured)) return 240;
  return Math.min(300, Math.max(60, configured));
}

async function requireCloudflareTranscriptionCredentials(): Promise<{
  accountId: string;
  token: string;
}> {
  let accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ?? '';
  let token =
    (process.env.CLOUDFLARE_AI_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN)?.trim() ?? '';
  if (accountId && token) return { accountId, token };

  const db = createAdminClient();
  if (!accountId) {
    const { data, error } = await db.rpc('get_platform_secret', { p_key: 'CLOUDFLARE_ACCOUNT_ID' });
    if (!error && typeof data === 'string') accountId = data.trim();
  }
  if (!token) {
    const { data, error } = await db.rpc('get_platform_secret', {
      p_key: 'CLOUDFLARE_AI_API_TOKEN',
    });
    if (!error && typeof data === 'string') token = data.trim();
  }
  if (!accountId || !token) {
    throw new Error('Cloudflare rendered-audio transcription credentials are not configured');
  }
  return { accountId, token };
}

async function transcribeRenderedAudio(videoPath: string, workDir: string, expectedScript: string, minimumCoverage: number): Promise<string> {
  if (process.env.AI_TRANSCRIPTION_PROVIDER === 'local_whisper') {
    const { transcribeLocalAudio } = await import('./local-transcription.mjs');
    const decoded=await independentSpeechWindows({
      read:async(textProfile:'default'|'wide'|'nonoverlap')=>{
        const recognized=await transcribeLocalAudio(videoPath,{wordTimings:false,textProfile});
        reportCourseProgress('media-qa:transcription:'+basename(workDir)+':'+textProfile,1,1);
        return recognized.text;
      },
      coverage:(text:string)=>narrationCoverage(expectedScript,text),minimumCoverage,
    });
    console.info('[MediaQA] independent speech windows',{profile:decoded.profile,coverage:decoded.coverage,attempts:decoded.attempts});
    return decoded.transcript;
  }
  const model = resolveCloudflareTranscriptionModel();

  // Raw WAV expands long lessons enough to exceed the Workers AI request
  // boundary. Encode bounded mono MP3 segments so quality verification scales
  // with lesson duration without weakening the transcription requirement.
  const audioPattern = join(workDir, 'rendered-audio-%03d.mp3');
  await execFileAsync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      videoPath,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '48k',
      '-f',
      'segment',
      '-segment_time',
      String(cloudflareTranscriptionChunkSeconds()),
      '-reset_timestamps',
      '1',
      audioPattern,
    ],
    { timeout: 120_000, maxBuffer: 2_000_000 },
  );
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
    const payload = (await response.json()) as { result?: { text?: string } };
    const chunkTranscript = payload.result?.text?.trim() ?? '';
    if (!chunkTranscript) {
      throw new Error(
        `Rendered-audio transcription chunk ${index + 1}/${audioPaths.length} is empty`,
      );
    }
    transcriptParts.push(chunkTranscript);
  }
  const transcript = transcriptParts.join(' ').trim();
  if (!transcript) throw new Error('Rendered-audio transcription is empty');
  return transcript;
}

export async function enforceMediaQuality(input: {
  lessonPresentation?: 'approved-premium-v1';
  videoUrl: string;
  expectedDurationSeconds: number;
  expectedSceneCount: number;
  sceneData: MediaStoryboard;
  provider?: string;
  providerModel?: string;
  expectedScript: string;
  instructionalQuality: InstructionalQualityEvidence;
  narrationProviderClass?: 'professional' | 'diagnostic' | 'unknown';
}): Promise<MediaQualityEvidence> {
  const response = await fetch(input.videoUrl, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`MP4 returned HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const workDir = await mkdtemp(join(tmpdir(), 'elevate-media-quality-'));
  const videoPath = join(workDir, 'asset.mp4');
  try {
    await writeFile(videoPath, buffer);
    const { stdout: probeOutput } = await execFileAsync(
      'ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration:stream=codec_type,width,height',
        '-of',
        'json',
        videoPath,
      ],
      { timeout: 30_000, maxBuffer: 2_000_000 },
    );
    const probe = JSON.parse(String(probeOutput)) as {
      format?: { duration?: string };
      streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
    };
    const streams = probe.streams ?? [];
    const videoStream = streams.find((stream) => stream.codec_type === 'video');
    const narrationCoverageAdvisory = input.lessonPresentation === 'approved-premium-v1';
    const actualTranscript = await transcribeRenderedAudio(videoPath, workDir, input.expectedScript, narrationCoverageAdvisory ? 0.75 : 0.9);
    const warnings: string[] = [];
    const totalCoverage = narrationCoverage(input.expectedScript, actualTranscript);
    if (narrationCoverageSeverity(totalCoverage, narrationCoverageAdvisory) === 'warning')
      warnings.push(`MEDIA_NARRATION_COVERAGE_ADVISORY:${totalCoverage.toFixed(3)}`);
    const evidenceScenes = input.sceneData.scenes.filter((scene) =>
      Boolean(scene.requiredVisualEvidence),
    );
    // A moving source is the delivered visual for a scene. Audit it before the
    // still fallback so different thumbnails cannot hide one repeated clip.
    const visualKeys = input.sceneData.scenes.map(
      (scene) =>
        scene.sourceVideoUrl || scene.referenceImageUrl || scene.action.trim().toLowerCase(),
    );
    const counts = new Map<string, number>();
    visualKeys.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
    const deliveredProcedurePhases = [
      ...new Set(
        input.sceneData.scenes
          .map((scene) => scene.procedurePhase)
          .filter((value): value is NonNullable<typeof value> => Boolean(value)),
      ),
    ];
    const requiredProcedurePhases = [
      ...new Set(
        input.sceneData.scenes
          .filter((scene) => Boolean(scene.requiredVisualEvidence))
          .map((scene) => scene.procedurePhase)
          .filter((value): value is NonNullable<typeof value> => Boolean(value)),
      ),
    ];
    const sourcedScenes = input.sceneData.scenes.filter((scene) =>
      Boolean(scene.resolvedProvider && scene.resolvedModel),
    );
    const verifiedTeachingPictures=verifiedTeachingPhotoScene;
    const licensedScenes = input.sceneData.scenes.filter((scene) =>
      Boolean(
        scene.resolvedProvider &&
        !verifiedTeachingPictures(scene) && !['remotion', 'elevate-owned', 'elevate-motion'].includes(scene.resolvedProvider),
      ),
    );
    const licensedScenesWithEvidence = licensedScenes.filter((scene) =>
      Boolean(scene.sourceLicenseEvidenceUrl),
    );
    const sourceProviders = [
      ...new Set(
        input.sceneData.scenes
          .map((scene) => scene.resolvedProvider)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const licenseEvidenceUrls = [
      ...new Set(
        input.sceneData.scenes
          .map((scene) => scene.sourceLicenseEvidenceUrl)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const exactSceneTypes = new Set([
      'equipment_closeup',
      'worked_example',
      'common_mistake',
      'safety_warning',
    ]);
    const exactScenes = input.sceneData.scenes.filter(
      (scene) => scene.sceneType && exactSceneTypes.has(scene.sceneType),
    );
    const verifiedExactScenes = exactScenes.filter((scene) => {
      const provider = scene.resolvedProvider ?? '';
      if(verifiedTeachingPictures(scene)) return true;
      if (['wan', 'ltx', 'remotion'].includes(provider)) return true;
      return Boolean(provider && scene.sourceLicenseEvidenceUrl);
    });

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
      [
        '-hide_banner',
        '-i',
        videoPath,
        '-filter:v',
        "select='gt(scene,0.12)',showinfo",
        '-an',
        '-f',
        'null',
        '-',
      ],
      { timeout: analysisTimeoutMs, maxBuffer: 64_000_000 },
    );
    const { stderr: freezeOutput } = await execFileAsync(
      'ffmpeg',
      [
        '-hide_banner',
        '-i',
        videoPath,
        '-vf',
        'freezedetect=n=-45dB:d=2',
        '-an',
        '-f',
        'null',
        '-',
      ],
      { timeout: analysisTimeoutMs, maxBuffer: 64_000_000 },
    );
    const { stderr: blackOutput } = await execFileAsync(
      'ffmpeg',
      [
        '-hide_banner',
        '-i',
        videoPath,
        '-vf',
        'blackdetect=d=0.3:pix_th=0.10',
        '-an',
        '-f',
        'null',
        '-',
      ],
      { timeout: analysisTimeoutMs, maxBuffer: 64_000_000 },
    );
    const temporalReplay = await detectBackwardTimelineReplay(videoPath, workDir);
    // These are narrated instructional slides, not continuous-action films.
    // A deliberate hold is acceptable only when its *entire* measured freeze
    // lies inside one authored, non-footage slide. Never waive freezes across
    // scene boundaries or on sourced motion/demonstrations.
    const slideStarts: Array<{ start: number; end: number; staticSlide: boolean }> = [];
    let slideCursor = Number((input.sceneData as any).preRollDurationSeconds ?? 0) +
      (input.lessonPresentation === 'approved-premium-v1' ? 0 : 3);
    for (const scene of input.sceneData.scenes) {
      const duration = Number(scene.durationSeconds);
      const staticSlide = Number.isFinite(duration) && duration > 0 &&
        !scene.sourceVideoUrl && !scene.clipUrl &&
        Boolean(scene.teachingVisual || scene.referenceImageUrl || scene.subject);
      slideStarts.push({start:slideCursor,end:slideCursor+duration,staticSlide});
      slideCursor += duration;
    }
    const freezeIntervals = parseFreezeIntervals(String(freezeOutput), actualDurationSeconds);
    const unexplainedFreezes = freezeIntervals.filter(interval =>
      !slideStarts.some(scene => scene.staticSlide &&
        interval.start >= scene.start + 0.1 && interval.end <= scene.end - 0.1));
    // Frame-similarity is not itself proof of a backwards timebase jump.
    // Keep a hard failure for repeating footage/within-scene motion, while
    // recording matched slide-to-slide instructional reuse as advisory.
    const explainedSlideRepeats = temporalReplay.temporalReplayMatches.filter(match => {
      const prior = slideStarts.find(scene => scene.staticSlide &&
        match.priorStartSeconds >= scene.start &&
        match.priorStartSeconds + match.durationSeconds <= scene.end);
      const later = slideStarts.find(scene => scene.staticSlide &&
        match.replayStartSeconds >= scene.start &&
        match.replayStartSeconds + match.durationSeconds <= scene.end);
      return Boolean(prior && later && prior !== later);
    });
    const unexplainedReplayMatches = temporalReplay.temporalReplayMatches.filter(
      match => !explainedSlideRepeats.includes(match));

    // OCR the encoded title at desktop and a phone-sized delivery width.
    // Metadata about font sizes cannot establish that the final picture is readable.
    const readability: NonNullable<MediaQualityEvidence['readability']> = [];
    const teachingVisualEvidence: NonNullable<MediaQualityEvidence['teachingVisualEvidence']> = [];
    const sceneNarrationEvidence: NonNullable<MediaQualityEvidence['sceneNarrationEvidence']> = [];
    const premium=input.lessonPresentation==='approved-premium-v1';
    const approvedPresentationInspection: NonNullable<MediaQualityEvidence['approvedPresentationInspection']> = {pass:false,backgrounds:[],captions:[]};
    let sceneStart = Number((input.sceneData as any).preRollDurationSeconds ?? 0) + (premium ? 0 : 3);
    for (const [index, scene] of input.sceneData.scenes.entries()) {
      const time = sceneStart + Math.min(2, scene.durationSeconds / 2);
      if(premium) {
        const pixels=await execFileAsync('ffmpeg',['-v','error','-ss',String(time),'-i',videoPath,'-frames:v','1','-vf','crop=2:2:0:0,format=rgb24','-f','rawvideo','pipe:1'],{encoding:'buffer',timeout:30000,maxBuffer:1000000});
        const passed=charcoalPixelsMatch(pixels.stdout);
        approvedPresentationInspection.backgrounds.push({sceneId:scene.id,passed});
        if(!passed)throw new Error('APPROVED_ENCODED_CHARCOAL_BACKGROUND_REQUIRED:'+scene.id);
        const samples=captionSampleGroups((scene as any).wordAlignment,(scene as any).recapStartSeconds,(scene as any).captionCues);
        if(!samples.length)throw new Error('APPROVED_ENCODED_CAPTION_SAMPLES_REQUIRED:'+scene.id);
        for(const [sampleIndex,sample] of samples.entries()) for(const width of [1280,390]) {
          const captionTime=sceneStart+(sample.startSeconds+sample.endSeconds)/2;
          const frame=join(workDir,`caption-${index}-${sampleIndex}-${width}.png`);
          await execFileAsync('ffmpeg',['-y','-ss',String(captionTime),'-i',videoPath,'-frames:v','1','-vf',`scale=${width}:-1,crop=iw:ih/6:0:ih*5/6`,frame],{timeout:30000,maxBuffer:1000000});
          const decoded=await execFileAsync('tesseract',[frame,'stdout','--psm','6'],{timeout:30000,maxBuffer:1000000});
          const wordCoverage=captionWordCoverage(sample.text,decoded.stdout);
          approvedPresentationInspection.captions.push({sceneId:scene.id,width,time:captionTime,expected:sample.text,decoded:decoded.stdout,wordCoverage});
          if(wordCoverage<0.85)throw new Error(`APPROVED_ENCODED_BOTTOM_CAPTIONS_REQUIRED:${scene.id}:${width}`);
        }
      }
      for (const width of [1280, 390]) {
        const frame = join(workDir, `readability-${index}-${width}.png`);
        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-ss',
            String(time),
            '-i',
            videoPath,
            '-frames:v',
            '1',
            '-vf',
            `scale=${width}:-1`,
            frame,
          ],
          { timeout: 30000, maxBuffer: 1000000 },
        );
        const { wordCoverage, ocrMode } = await readEncodedTitle({
          frame, expectedTitle: scene.subject, titleLayout: premium ? PREMIUM_TITLE_LAYOUT : scene.titleLayout,
        });
        readability.push({ scene: index + 1, width, wordCoverage, ocrMode });
        if (wordCoverage < MIN_TITLE_WORD_COVERAGE) throw new Error(`${premium ? 'MEDIA_TEXT_UNREADABLE_AFTER_REGION' : 'MEDIA_TEXT_UNREADABLE'}:${index + 1}:${width}`);
      }
      // Inspect every authored teaching state in the encoded movie, including
      // phone delivery. A diagram or record listed in metadata is not evidence
      // that the compositor actually rendered it.
      const speechCues=(scene as any).wordAlignment?.map((w:any)=>({text:w.word,startSeconds:w.start,endSeconds:w.end}))??[];
      const states=(scene.teachingVisual?.steps??[]).map((step:any,index:number)=>({step,index,start:premium?quoteStartSeconds(step.narrationQuote,speechCues):index*scene.durationSeconds/scene.teachingVisual!.steps.length}));
      if(premium) states.push({step:{label:'Fresh recap',value:(scene as any).recapText},index:states.length,start:(scene as any).recapStartSeconds});
      for (const [stateIndex,state] of states.entries()) {
        const stepIndex=state.index;
        const localTime=state.start+Math.min(1,(states[stateIndex+1]?.start??scene.durationSeconds)-state.start>0 ? ((states[stateIndex+1]?.start??scene.durationSeconds)-state.start)/2 : 0);
        const time = sceneStart + localTime;
        for (const width of [1280,390]) {
          // Centered flex text can extend above its nominal 225px panel when
          // a long value wraps. Inspect the full teaching column below the
          // heading and above bottom captions, including its visible label.
          const frame=join(workDir,`teaching-${index}-${stepIndex}-${width}.png`);
          await execFileAsync('ffmpeg',['-y','-ss',String(time),'-i',videoPath,'-frames:v','1','-vf',premium?`scale=${width}:-1,crop=${Math.floor(width*646/1920)}:${Math.floor(width*720/1920)}:${Math.floor(width*1220/1920)}:${Math.floor(width*160/1920)}`:`scale=${width}:-1`,frame],{timeout:30000,maxBuffer:1000000});
          let {stdout:decoded}=await execFileAsync('tesseract',[frame,'stdout','--psm','11'],{timeout:30000,maxBuffer:1000000});
          let ocrMode: 'sparse' | 'block' | 'block-upscaled' = 'sparse';
          const expected=premium?state.step.label+' '+state.step.value:teachingPresentation(scene.teachingVisual!, time-sceneStart, scene.durationSeconds).expectedText;
          const words=[...new Set(normalizedWords(expected).filter(w=>w.length>2))];
          const coverageOf = (text: string) => {
            const observed = new Set(normalizedWords(text));
            return words.length ? words.filter(word => observed.has(word)).length / words.length : 0;
          };
          let wordCoverage = coverageOf(decoded);
          // Sparse OCR sometimes interprets a bordered form as one graphic.
          // Re-inspect the same encoded pixels as a text block; the evidence
          // and required 85% coverage stay unchanged. Never use source text as OCR.
          if (wordCoverage < 0.85) {
            const block = await execFileAsync('tesseract', [frame, 'stdout', '--psm', '6'], {timeout:30000,maxBuffer:1000000});
            const blockCoverage = coverageOf(block.stdout);
            if (blockCoverage > wordCoverage) { decoded = block.stdout; wordCoverage = blockCoverage; ocrMode = 'block'; }
          }
          // Small encoded glyphs can confuse l/i in OCR even when legible.
          // Re-read only the same decoded pixels at a larger sampling scale.
          // Never substitute authored text or lower the required coverage.
          if (wordCoverage < 0.85) {
            const enlarged = join(workDir, `teaching-${index}-${stepIndex}-${width}-ocr.png`);
            await execFileAsync('ffmpeg', ['-v','error','-y','-i',frame,'-vf','scale=iw*4:ih*4:flags=lanczos',enlarged], {timeout:30000,maxBuffer:1000000});
            const block = await execFileAsync('tesseract', [enlarged,'stdout','--psm','6'], {timeout:30000,maxBuffer:1000000});
            const enlargedCoverage = coverageOf(block.stdout);
            if (enlargedCoverage > wordCoverage) { decoded = block.stdout; wordCoverage = enlargedCoverage; ocrMode = 'block-upscaled'; }
          }
          teachingVisualEvidence.push({sceneId:scene.id,step:stepIndex,width,time,expected,decoded,wordCoverage,ocrMode});
          if (wordCoverage<0.85) throw new Error(`MEDIA_TEACHING_STATE_NOT_VISIBLE:${scene.id}:${stepIndex}:${width}`);
        }
      }
      if (scene.teachingVisual) {
        const directory=await mkdtemp(join(workDir,`scene-${index}-`));
        const audio=join(directory,'rendered-scene.mp3');
        await execFileAsync('ffmpeg',['-y','-ss',String(sceneStart),'-i',videoPath,'-t',String(scene.durationSeconds),'-vn','-ac','1','-ar','16000',audio],{timeout:60000,maxBuffer:1000000});
        const transcript=await transcribeRenderedAudio(audio,directory,scene.dialogue ?? scene.action,narrationCoverageAdvisory ? 0.75 : 0.9);
        const coverage=narrationCoverage(scene.dialogue ?? scene.action,transcript);
        sceneNarrationEvidence.push({sceneId:scene.id,startSeconds:sceneStart,endSeconds:sceneStart+scene.durationSeconds,actualTranscript:transcript,coverage});
        const severity = narrationCoverageSeverity(coverage, narrationCoverageAdvisory);
        const finding = `MEDIA_SCENE_NARRATION_MISMATCH:${scene.id}:${coverage.toFixed(3)}`;
        if (severity === 'error') throw new Error(finding);
        if (severity === 'warning') warnings.push(finding);
      }
      sceneStart += scene.durationSeconds;
    }
    if (freezeIntervals.length && !unexplainedFreezes.length &&
        longestMetric(String(freezeOutput), 'freeze_duration') > MAX_FREEZE_SECONDS)
      warnings.push('MEDIA_INTENTIONAL_SLIDE_HOLD_VERIFIED');
    if (explainedSlideRepeats.length)
      warnings.push(`MEDIA_CROSS_SLIDE_REUSE_VERIFIED:${explainedSlideRepeats.length}`);
    const evidence: MediaQualityEvidence = {
      ...(premium?{approvedPresentationInspection:{...approvedPresentationInspection,pass:true}}:{}),
      gateVersion: MEDIA_QUALITY_GATE_VERSION,
      mediaSha256: createHash('sha256').update(buffer).digest('hex'),
      actualTranscript,
      narrationCoverageAdvisory,
      warnings,
      readability,
      teachingVisualEvidence,
      sceneNarrationEvidence,
      bytes: buffer.length,
      actualDurationSeconds,
      expectedDurationSeconds: input.expectedDurationSeconds,
      videoStreams: streams.filter((stream) => stream.codec_type === 'video').length,
      audioStreams: streams.filter((stream) => stream.codec_type === 'audio').length,
      width: Number(videoStream?.width ?? 0),
      height: Number(videoStream?.height ?? 0),
      openingStillUrl: input.sceneData.scenes[0]?.referenceImageUrl,
      sceneChanges: (String(sceneOutput).match(/pts_time:/g) ?? []).length,
      longestFreezeSeconds: freezeIntervals.length
        ? Math.max(0, ...unexplainedFreezes.map(interval => interval.end - interval.start))
        : longestMetric(String(freezeOutput), 'freeze_duration'),
      longestBlackSeconds: longestMetric(String(blackOutput), 'black_duration'),
      expectedSceneCount: input.expectedSceneCount,
      storyboardSceneCount: input.sceneData.scenes.length,
      captionUrl: input.sceneData.captionUrl,
      transcriptUrl: input.sceneData.transcriptUrl,
      provider: input.provider,
      providerModel: input.providerModel,
      narrationCoverage: narrationCoverage(input.expectedScript, actualTranscript),
      visualEvidenceCoverage: input.sceneData.scenes.length
        ? evidenceScenes.length / input.sceneData.scenes.length
        : 0,
      repeatedVisualMaximum: Math.max(0, ...counts.values()),
      backwardTimelineJumpDetected: unexplainedReplayMatches.length > 0,
      repeatedTemporalSequenceCount: unexplainedReplayMatches.length,
      temporalReplayMatches: temporalReplay.temporalReplayMatches,
      requiredProcedurePhases,
      deliveredProcedurePhases,
      sourceEvidenceCoverage: input.sceneData.scenes.length
        ? sourcedScenes.length / input.sceneData.scenes.length
        : 0,
      exactVisualSourceCoverage: exactScenes.length
        ? verifiedExactScenes.length / exactScenes.length
        : 1,
      licenseEvidenceCoverage: licensedScenes.length
        ? licensedScenesWithEvidence.length / licensedScenes.length
        : 1,
      sourceProviders,
      licenseEvidenceUrls,
      instructionalQuality: input.instructionalQuality,
      narrationProviderClass:
        input.narrationProviderClass ??
        (['edge', 'local'].includes(configuredNarrationProvider()) ? 'diagnostic' : 'professional'),
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

export interface MeasuredCaptionCue {
  startSeconds: number;
  endSeconds: number;
  text: string;
}
/** Speech recognition exposes decoded word start/end times. Missing timing
 * data blocks the strict renderer; do not substitute estimated phrase timing. */
export async function measureNarrationCaptions(
  audio: Buffer,
  expectedScript: string,
  durationSeconds: number,
  onWordAlignment?: (words:Array<{word:string;start:number;end:number}>)=>void,
): Promise<MeasuredCaptionCue[]> {
  let words: Array<{ word: string; start: number; end: number }>;
  if (process.env.AI_TRANSCRIPTION_PROVIDER === 'local_whisper') {
    const { transcribeLocalAudio } = await import('./local-transcription.mjs');
    words = (await transcribeLocalAudio(audio)).words;
  } else {
    const { accountId, token } = await requireCloudflareTranscriptionCredentials();
    const model = resolveCloudflareTranscriptionModel();
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'audio/mpeg' },
        body: Uint8Array.from(audio).buffer,
        signal: AbortSignal.timeout(180000),
      },
    );
    if (!response.ok) throw new Error(`Caption alignment returned HTTP ${response.status}`);
    const payload = await response.json();
    words = payload.result?.words;
    }
  if (
    !Array.isArray(words) ||
    !words.length ||
    words.some(
      (w, i) =>
        typeof w.word !== 'string' ||
        !w.word.trim() ||
        !Number.isFinite(w.start) ||
        !Number.isFinite(w.end) ||
        w.start < 0 ||
        w.end <= w.start ||
        w.end > durationSeconds + 0.2 ||
        (i > 0 && w.start < words[i - 1].start),
    )
  )
    throw new Error(`ULTIMATE_RECOGNIZED_WORD_TIMINGS_REQUIRED:${JSON.stringify({
      durationSeconds,
      wordCount: Array.isArray(words) ? words.length : 0,
      invalid: Array.isArray(words) ? words.map((w, i) => ({
        index: i, start: w.start, end: w.end,
        previousStart: i > 0 ? words[i - 1].start : null,
        empty: typeof w.word !== 'string' || !w.word.trim(),
      })).filter((w) => w.empty || !Number.isFinite(w.start) || !Number.isFinite(w.end) ||
        w.start < 0 || w.end <= w.start || w.end > durationSeconds + 0.2 ||
        (w.previousStart !== null && w.start < w.previousStart)).slice(0, 3) : [],
    })}`);
  // Coverage scoring is advisory: transcription word matching must not stop course production.
  // Keep the independently validated word timings and generate captions from recognized speech.
  onWordAlignment?.(words);
  const cues: MeasuredCaptionCue[] = [];
  for (let index = 0; index < words.length; index += 8) {
    const phrase = words.slice(index, index + 8);
    cues.push({
      startSeconds: phrase[0].start,
      endSeconds: phrase[phrase.length - 1].end,
      text: phrase.map((w) => w.word).join(' '),
    });
  }
  return cues;
}

