import { describe, expect, it } from 'vitest';
import { isArchivedProgramSlug } from '@/lib/programs/archived-program-slugs';

describe('archived program slugs', () => {
  it('keeps current program slugs active', () => {
    expect(isArchivedProgramSlug('tax-preparation')).toBe(false);
    expect(isArchivedProgramSlug('tax-prep')).toBe(false);
    expect(isArchivedProgramSlug('hvac-technician')).toBe(false);
  });
});
