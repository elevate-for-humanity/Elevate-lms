import { describe, expect, it } from 'vitest';
import { isArchivedProgramSlug } from '@/lib/programs/archived-program-slugs';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

describe('archived program slugs', () => {
  it('flags retired tax program slugs', () => {
    expect(isArchivedProgramSlug('tax-preparation')).toBe(true);
    expect(isArchivedProgramSlug('tax-prep')).toBe(true);
    expect(isArchivedProgramSlug('hvac-technician')).toBe(false);
  });

  it('loadProgramForPage returns null for archived slugs', async () => {
    await expect(loadProgramForPage('tax-preparation')).resolves.toBeNull();
    await expect(loadProgramForPage('tax-prep')).resolves.toBeNull();
  });
});
