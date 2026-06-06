import { describe, expect, it } from 'vitest';
import {
  closestDalle3Size,
  DALLE3_SIZE,
  MEDIA_SLOTS,
  PROGRAM_CARD,
  PROGRAM_HERO_SOURCE,
} from '@/lib/images/media-dimensions';

describe('media-dimensions', () => {
  it('program card is 4:3 at 1200×900', () => {
    expect(PROGRAM_CARD.width / PROGRAM_CARD.height).toBeCloseTo(4 / 3, 5);
    expect(MEDIA_SLOTS.programCard.aspect).toBe('4/3');
  });

  it('program hero source is 16:9', () => {
    expect(PROGRAM_HERO_SOURCE.width / PROGRAM_HERO_SOURCE.height).toBeCloseTo(16 / 9, 5);
  });

  it('maps landscape targets to DALL·E landscape size', () => {
    expect(closestDalle3Size(PROGRAM_HERO_SOURCE)).toBe(DALLE3_SIZE.landscape);
    expect(closestDalle3Size(PROGRAM_CARD)).toBe(DALLE3_SIZE.landscape);
  });

  it('exports program card next/image sizes', () => {
    expect(MEDIA_SLOTS.programCard.nextImageSizes).toContain('400px');
  });
});
