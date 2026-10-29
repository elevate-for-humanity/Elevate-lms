import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  cloudflareTranscriptionChunkSeconds,
  MEDIA_QUALITY_GATE_VERSION,
  mediaQualityFailures,
  parseFreezeIntervals,
  resolveCloudflareTranscriptionModel,
  type MediaQualityEvidence,
} from '@/lib/video/media-quality-gate';

const validEvidence: MediaQualityEvidence = {
  gateVersion: MEDIA_QUALITY_GATE_VERSION,
  bytes: 2_000_000,
  actualDurationSeconds: 148,
  expectedDurationSeconds: 148,
  videoStreams: 1,
  audioStreams: 1,
  width: 1920,
  height: 1080,
  openingStillUrl: 'https://assets.example/lesson-poster.jpg',
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
  narrationProviderClass: 'professional',
  backwardTimelineJumpDetected: false,
  repeatedTemporalSequenceCount: 0,
  licenseEvidenceCoverage: 1,
  sourceProviders: ['envato'],
  licenseEvidenceUrls: ['https://example.org/license'],
  visualEvidenceCoverage: 1,
  repeatedVisualMaximum: 1,
  requiredProcedurePhases: ['procedure'],
  deliveredProcedurePhases: ['procedure'],
  sourceEvidenceCoverage: 1,
  exactVisualSourceCoverage: 1,
  instructionalQuality: {
    wordCount: 190,
    minimumWordCount: 180,
    courseDomain: 'cosmetology',
    demonstrationClaimed: false,
    demonstrationScenes: 1,
    titleKeywordCoverage: 1,
    sceneTypeCoverage: 0.2,
    hasMentalModel: false,
    hasWorkedExample: true,
    hasMemoryRecap: false,
    hasKnowledgeCheck: false,
    hasSafetyScene: true,
    objectiveCoverage: 1,
    sceneNarrationAlignment: 1,
    instructionLeakageDetected: false,
    repeatedNarrationSegments: 0,
    repeatedSceneDialogues: 0,
  },
};

describe('canonical media completion quality gate', () => {
  it('uses Cloudflare Whisper when Cloudflare is the canonical provider', () => {
    expect(
      resolveCloudflareTranscriptionModel({
        AI_PROVIDER: 'cloudflare',
        CLOUDFLARE_ACCOUNT_ID: 'account-id',
        CLOUDFLARE_AI_API_TOKEN: 'token',
      }),
    ).toBe('@cf/openai/whisper');
  });

  it('preserves an explicitly configured Cloudflare transcription model', () => {
    expect(
      resolveCloudflareTranscriptionModel({
        AI_TRANSCRIPTION_PROVIDER: 'cloudflare',
        AI_TRANSCRIPTION_MODEL: '@cf/openai/whisper-large-v3-turbo',
      }),
    ).toBe('@cf/openai/whisper-large-v3-turbo');
  });

  it('keeps transcription chunks below the long-lesson upload boundary', () => {
    expect(cloudflareTranscriptionChunkSeconds({})).toBe(240);
    expect(cloudflareTranscriptionChunkSeconds({ AI_TRANSCRIPTION_CHUNK_SECONDS: '900' })).toBe(
      300,
    );
    expect(cloudflareTranscriptionChunkSeconds({ AI_TRANSCRIPTION_CHUNK_SECONDS: '5' })).toBe(60);
  });

  it('accepts complete evidence', () => {
    expect(mediaQualityFailures(validEvidence)).toEqual([]);
  });

  it('treats missing per-scene license metadata as advisory for approved course media', () => {
    const evidence: MediaQualityEvidence = {
      ...validEvidence,
      licenseEvidenceCoverage: 0,
      warnings: [],
    };
    expect(mediaQualityFailures(evidence)).toEqual([]);
    expect(evidence.warnings).toContain(
      'per-scene license metadata is incomplete; approved course-source provenance was retained',
    );
  });


  it('treats ASR as presence evidence while still rejecting materially incomplete narration', () => {
    expect(mediaQualityFailures({ ...validEvidence, narrationCoverage: 0.907 })).toEqual([]);
    expect(mediaQualityFailures({ ...validEvidence, narrationCoverage: 0.899 })).toEqual(
      expect.arrayContaining([expect.stringContaining('narration coverage')]),
    );
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
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('duration mismatch'),
        expect.stringContaining('insufficient visual changes'),
        expect.stringContaining('frozen interval'),
        expect.stringContaining('storyboard mismatch'),
        'caption URL is missing',
        'transcript URL is missing',
      ]),
    );
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
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('too small'),
        'MP4 has no narration/audio stream',
        'provider evidence is missing',
        'provider model evidence is missing',
      ]),
    );
  });

  it('accepts HD 720p delivery', () => {
    expect(mediaQualityFailures({ ...validEvidence, width: 1280, height: 720 })).toEqual([]);
  });

  it('rejects blurry-scale delivery and a missing opening photograph', () => {
    const failures = mediaQualityFailures({
      ...validEvidence,
      width: 640,
      height: 360,
      openingStillUrl: undefined,
    });
    expect(failures).toEqual(
      expect.arrayContaining([
        expect.stringContaining('below 1280x720'),
        'photographic opening still is missing',
      ]),
    );
  });
});

describe('FFmpeg freeze parser — narrated-slide regression cases', () => {
  it('parses normal and multiple intervals in chronological order', () => {
    const logs = '[freezedetect] freeze_start: 12.10\\n[freezedetect] freeze_end: 17.47 | freeze_duration: 5.37\\n[freezedetect] freeze_start: 28\\n[freezedetect] freeze_end: 29';
    expect(parseFreezeIntervals(logs, 40)).toEqual([{start:12.1,end:17.47},{start:28,end:29}]);
  });
  it('retains freezes ending at EOF instead of silently passing', () => {
    expect(parseFreezeIntervals('freeze_start: 12.1', 20)).toEqual([{start:12.1,end:20}]);
  });
  it('rejects overlapping starts and orphan ends', () => {
    expect(() => parseFreezeIntervals('freeze_start: 2\\nfreeze_start: 3\\nfreeze_end: 6',10))
      .toThrow('MEDIA_FREEZE_OVERLAPPING_STARTS');
    expect(() => parseFreezeIntervals('freeze_end: 3',10)).toThrow('MEDIA_FREEZE_END_WITHOUT_START');
  });
  it('rejects malformed durations and impossible timestamps', () => {
    expect(() => parseFreezeIntervals('freeze_start: 20', 10)).toThrow('MEDIA_FREEZE_TIMESTAMP_INVALID');
  });
  it('preserves a strict failure for unexplained motion freezes', () => {
    expect(mediaQualityFailures({...validEvidence,longestFreezeSeconds:5.37})).toContain('frozen interval 5.37s exceeds 4s');
  });
  it('allows a measured intentional slide hold when no unexplained freeze remains', () => {
    expect(parseFreezeIntervals('freeze_start: 12.1\\nfreeze_end: 17.47',20)).toEqual([{start:12.1,end:17.47}]);
    expect(mediaQualityFailures({...validEvidence,longestFreezeSeconds:0})).toEqual([]);
  });
});
