import { describe, expect, it } from 'vitest';
import {
  getCanonicalPublicProgramSlug,
  getPublicProgramCategoryLabel,
} from '../../lib/programs/public-programs-page';

describe('public program identity', () => {
  it('preserves exact database slugs instead of silently aliasing records', () => {
    for (const slug of ['business', 'business-administration', 'bookkeeping-fundamentals', 'it-support-specialist']) {
      expect(getCanonicalPublicProgramSlug(slug)).toBe(slug);
    }
  });

  it('normalizes only casing and surrounding whitespace', () => {
    expect(getCanonicalPublicProgramSlug('  HVAC-Technician  ')).toBe('hvac-technician');
  });

  it('normalizes public category labels', () => {
    expect(getPublicProgramCategoryLabel('business')).toBe('Business & Financial');
    expect(getPublicProgramCategoryLabel('trades')).toBe('Skilled Trades');
    expect(getPublicProgramCategoryLabel('technology')).toBe('Technology');
    expect(getPublicProgramCategoryLabel('healthcare')).toBe('Healthcare');
  });
});
