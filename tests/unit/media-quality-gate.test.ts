import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { mediaQualityFailures, type MediaQualityEvidence } from '@/lib/video/media-quality-gate';

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
};

describe('canonical media completion quality gate', () => {
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

  it('rejects silent, tiny, single-scene, and unattributed output', () => {
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
      'instructional asset requires at least two purposeful scenes',
      'provider evidence is missing',
      'provider model evidence is missing',
    ]));
  });
});
