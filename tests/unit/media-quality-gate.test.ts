import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  mediaQualityFailures,
  resolveTranscriptionRuntime,
  type MediaQualityEvidence,
} from '@/lib/video/media-quality-gate';

const validEvidence: MediaQualityEvidence = {
  bytes: 2_000_000,
  actualDurationSeconds: 148,
  expectedDurationSeconds: 148,
  videoStreams: 1,
  audioStreams: 1,
  sceneChanges: 4,
  longestFreezeSeconds: 1.8,
  longestBlackSeconds: 0,
  expectedSceneCount: 5,
  storyboardSceneCount: 5,
  captionUrl: 'https://assets.example/lesson.vtt',
  transcriptUrl: 'https://assets.example/lesson.txt',
  provider: 'remotion',
  providerModel: 'SlideLesson',
  narrationCoverage: 1,
  visualEvidenceCoverage: 1,
  repeatedVisualMaximum: 1,
  requiredProcedurePhases: ['procedure'],
  deliveredProcedurePhases: ['procedure'],
};

describe('canonical media completion quality gate', () => {
  it('uses Cloudflare Whisper when Cloudflare is the canonical provider', () => {
    expect(resolveTranscriptionRuntime({
      AI_PROVIDER: 'cloudflare',
      CLOUDFLARE_ACCOUNT_ID: 'account-id',
      CLOUDFLARE_AI_API_TOKEN: 'token',
    })).toEqual({ provider: 'cloudflare', model: '@cf/openai/whisper' });
  });

  it('preserves an explicitly configured Cloudflare transcription model', () => {
    expect(resolveTranscriptionRuntime({
      AI_TRANSCRIPTION_PROVIDER: 'cloudflare',
      AI_TRANSCRIPTION_MODEL: '@cf/openai/whisper-large-v3-turbo',
    })).toEqual({ provider: 'cloudflare', model: '@cf/openai/whisper-large-v3-turbo' });
  });

  it('keeps OpenAI transcription independent from the text-generation provider', () => {
    expect(resolveTranscriptionRuntime({
      AI_TRANSCRIPTION_PROVIDER: 'openai',
      AI_TRANSCRIPTION_MODEL: 'gpt-4o-mini-transcribe',
    })).toEqual({ provider: 'openai', model: 'gpt-4o-mini-transcribe' });
  });

  it('accepts complete evidence', () => {
    expect(mediaQualityFailures(validEvidence)).toEqual([]);
  });

  it('rejects the previously accepted 27-second frozen asset', () => {
    const failures = mediaQualityFailures({
      ...validEvidence,
      actualDurationSeconds: 27.05,
      sceneChanges: 0,
      longestFreezeSeconds: 20.7,
      expectedSceneCount: 3,
      storyboardSceneCount: 0,
      captionUrl: undefined,
      transcriptUrl: undefined,
    });
    expect(failures).toEqual(expect.arrayContaining([
      expect.stringContaining('duration mismatch'),
      expect.stringContaining('insufficient visual changes'),
      expect.stringContaining('frozen interval'),
      expect.stringContaining('storyboard mismatch'),
      'caption URL is missing',
      'transcript URL is missing',
    ]));
  });

  it('rejects silent, tiny, and unattributed output while permitting a validated microclip scene', () => {
    const failures = mediaQualityFailures({
      ...validEvidence,
      bytes: 12,
      audioStreams: 0,
      expectedSceneCount: 1,
      storyboardSceneCount: 1,
      provider: undefined,
      providerModel: undefined,
    });
    expect(failures).toEqual(expect.arrayContaining([
      expect.stringContaining('too small'),
      'MP4 has no narration/audio stream',
      'provider evidence is missing',
      'provider model evidence is missing',
    ]));
  });
});
