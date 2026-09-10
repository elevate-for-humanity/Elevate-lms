import { describe, expect, it } from 'vitest';
import {
  PROGRAMS_PAGE_SUPPRESSED_SLUGS,
  resolvePublicProgramCount,
} from '@/lib/programs/public-programs-page';

describe('public programs SSR catalog', () => {
  it('does not hide database records through a second static suppression list', () => {
    expect(PROGRAMS_PAGE_SUPPRESSED_SLUGS.size).toBe(0);
  });

  it('reports the database count without a fabricated marketing floor', () => {
    expect(resolvePublicProgramCount(0)).toBe(0);
    expect(resolvePublicProgramCount(42)).toBe(42);
    expect(resolvePublicProgramCount(-4)).toBe(0);
  });
});
