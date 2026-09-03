import { describe, expect, it } from 'vitest';
import { apprenticePortalPathForSlug } from '@/lib/portal/resolve-apprentice-program-slug';

describe('apprenticePortalPathForSlug', () => {
  it('maps known apprenticeship slugs to program portals', () => {
    expect(apprenticePortalPathForSlug('barber-apprenticeship')).toBe('/portal/barber');
    expect(apprenticePortalPathForSlug('cosmetology-apprenticeship')).toBe('/portal/cosmetology');
  });

  it('returns null for non-apprenticeship slugs (no barber default)', () => {
    expect(apprenticePortalPathForSlug('cna')).toBeNull();
    expect(apprenticePortalPathForSlug(null)).toBeNull();
    expect(apprenticePortalPathForSlug(undefined)).toBeNull();
  });
});
