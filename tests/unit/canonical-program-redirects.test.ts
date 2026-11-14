import { describe, expect, it } from 'vitest';
import { canonicalRoutes, legacyRouteAliases } from '@/lib/routes/canonical-routes';

describe('canonical program redirects', () => {
  const redirects = legacyRouteAliases;

  const programRedirects = redirects.filter(
    (r) => r.source.startsWith('/programs/') && r.destination !== '/programs',
  );

  it('no program slug redirects dump to /programs catalog', () => {
    const bad = redirects.filter(
      (r) =>
        r.source.startsWith('/programs/') &&
        r.destination === '/programs' &&
        r.source !== '/programs',
    );
    expect(bad.map((r) => r.source)).toEqual([]);
  });

  it('keeps the current program destinations in the canonical map', () => {
    expect(canonicalRoutes.programs.cdlTraining).toBe('/programs/cdl-training');
    expect(canonicalRoutes.programs.hvacTechnician).toBe('/programs/hvac-technician');
    expect(canonicalRoutes.programs.barberApprenticeship).toBe('/programs/barber-apprenticeship');
  });

  it('does not reintroduce retired program aliases', () => {
    expect(programRedirects).toEqual([]);
  });
});
