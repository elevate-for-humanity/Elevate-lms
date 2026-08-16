import { describe, it, expect } from 'vitest';
import {
  allowedRolesForPortalPath,
  canAccessApprenticeTools,
  isApprenticeFieldPortalPath,
} from '@/lib/portal/apprentice-access';

describe('apprentice portal access', () => {
  it('treats the canonical apprentice workspace as the apprenticeship field portal', () => {
    expect(isApprenticeFieldPortalPath('/apprentice')).toBe(true);
    expect(isApprenticeFieldPortalPath('/apprentice/barber-apprenticeship/workbook')).toBe(true);
    expect(isApprenticeFieldPortalPath('/portal/barber')).toBe(false);
  });

  it('keeps program_holder outside the apprentice runtime', () => {
    expect(allowedRolesForPortalPath('/apprentice')).not.toContain('program_holder');
    expect(allowedRolesForPortalPath('/apprentice')).toContain('apprentice');
    expect(allowedRolesForPortalPath('/apprentice')).toContain('barber_apprentice');
  });

  it('does not grant apprentice runtime roles based on retired portal paths', () => {
    expect(isApprenticeFieldPortalPath('/portal/healthcare')).toBe(false);
    expect(allowedRolesForPortalPath('/portal/healthcare')).not.toContain('program_holder');
  });

  it('keeps apprentice tools restricted to apprentice roles', () => {
    expect(canAccessApprenticeTools('program_holder')).toBe(false);
    expect(canAccessApprenticeTools('apprentice')).toBe(true);
    expect(canAccessApprenticeTools('barber_apprentice')).toBe(true);
    expect(canAccessApprenticeTools('employer')).toBe(false);
  });
});
