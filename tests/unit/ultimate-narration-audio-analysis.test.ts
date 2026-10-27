import { describe, expect, it } from 'vitest';
import { deriveNarrationMetrics } from '@/lib/ultimate-course-builder/quality/narration-audio-analysis';
import { evaluateNarration } from '@/lib/ultimate-course-builder/quality/narration-quality';

describe('Ultimate narration audio analysis', () => {
  it('produces complete, passing measurements for healthy synthesized speech', () => {
    const transcript = Array.from({ length: 301 }, (_, index) => `word${index}`).join(' ');
    const metrics = deriveNarrationMetrics(transcript, {
      durationSeconds: 145.968,
      meanVolumeDb: -25.1,
      maxVolumeDb: -2.1,
      unnaturalPauseCount: 0,
    });

    expect(metrics.wordsPerMinute.value).toBeCloseTo(123.73, 1);
    expect(metrics.clippedWords.value).toBe(0);
    expect(metrics.monotoneScore.value).toBe(0);
    expect(evaluateNarration(metrics)).toEqual({ pass: true, failures: [], unknown: [] });
  });

  it('fails closed when the waveform reaches clipping level', () => {
    const transcript = Array.from({ length: 300 }, (_, index) => `word${index}`).join(' ');
    const metrics = deriveNarrationMetrics(transcript, {
      durationSeconds: 140,
      meanVolumeDb: -20,
      maxVolumeDb: -0.1,
      unnaturalPauseCount: 0,
    });

    expect(evaluateNarration(metrics).failures).toContain('CLIPPED_WORDS');
  });
});
