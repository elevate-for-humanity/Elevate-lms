/**
 * tests/unit/master-studio-specialist.test.ts
 *
 * The OPENHANDS master-studio specialist is a plan label retained for
 * historical records, not a dispatch — and OpenHands has been removed.
 * Code work always falls through to ROUTER (the owned engine); the legacy
 * PARIS_REPAIR_ENGINE value is inert and cannot select OPENHANDS.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { selectMasterStudioSpecialist } from '@/lib/studio/master-runtime';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('selectMasterStudioSpecialist', () => {
  it('routes generic code work to ROUTER (no OpenHands opt-in exists)', () => {
    vi.stubEnv('PARIS_REPAIR_ENGINE', '');
    expect(selectMasterStudioSpecialist('Refactor the TypeScript repository')).toBe('ROUTER');
    expect(selectMasterStudioSpecialist('Fix the multi-file implementation')).toBe('ROUTER');
  });

  it('never selects OPENHANDS, even with the legacy opt-in value set', () => {
    vi.stubEnv('PARIS_REPAIR_ENGINE', 'openhands');
    expect(selectMasterStudioSpecialist('Refactor the TypeScript repository')).toBe('ROUTER');
  });

  it('keeps non-code specialists unchanged regardless of the legacy env value', () => {
    vi.stubEnv('PARIS_REPAIR_ENGINE', '');
    expect(selectMasterStudioSpecialist('Build a new course curriculum')).toBe('ELLIE');
    expect(selectMasterStudioSpecialist('Deploy the admin container')).toBe('LIZZY');
  });
});
