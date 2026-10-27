import { describe, expect, it } from 'vitest';
import { portalPreviewDestination } from '@/lib/admin/portal-preview-destination';

describe('portalPreviewDestination', () => {
  it('routes program holders to the program-holder dashboard', () => {
    expect(portalPreviewDestination('program_holder')).toBe('/program-holder/dashboard');
    expect(portalPreviewDestination('programholder')).toBe('/program-holder/dashboard');
  });

  it('does not route program holders to the host-shop dashboard', () => {
    expect(portalPreviewDestination('host_shop')).toBe('/host-shop/dashboard');
    expect(portalPreviewDestination('program_holder')).not.toBe('/host-shop/dashboard');
  });

  it('keeps apprentice and learner destinations stable', () => {
    expect(portalPreviewDestination('apprentice')).toBe('/apprentice');
    expect(portalPreviewDestination('student')).toBe('/lms/dashboard');
  });
});
