import { describe, it, expect } from 'vitest';
import {
  allowedRolesForPortalPath,
  canAccessApprenticeTools,
  isApprenticeFieldPortalPath,
} from '@/lib/portal/apprentice-access';

describe('apprentice portal access', () => {
  it('treats barber portal as apprenticeship field portal', () => {
    expect(isApprenticeFieldPortalPath('/portal/barber')).toBe(true);
    expect(isApprenticeFieldPortalPath('/portal/healthcare')).toBe(false);
  });

  it('keeps program_holder outside the barber apprentice runtime', () => {
    expect(allowedRolesForPortalPath('/portal/barber')).not.toContain('program_holder');
    expect(allowedRolesForPortalPath('/portal/barber')).toContain('apprentice');
    expect(allowedRolesForPortalPath('/portal/barber')).toContain('barber_apprentice');
  });

  it('does not allow program_holder on healthcare portal', () => {
    expect(allowedRolesForPortalPath('/portal/healthcare')).not.toContain('program_holder');
  });

  it('keeps apprentice tools restricted to apprentice roles', () => {
    expect(canAccessApprenticeTools('program_holder')).toBe(false);
    expect(canAccessApprenticeTools('apprentice')).toBe(true);
    expect(canAccessApprenticeTools('barber_apprentice')).toBe(true);
    expect(canAccessApprenticeTools('employer')).toBe(false);
  });
});
