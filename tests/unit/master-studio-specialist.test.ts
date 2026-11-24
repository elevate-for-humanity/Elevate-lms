/**
 * tests/unit/master-studio-specialist.test.ts
 *
 * The OPENHANDS master-studio specialist is a plan label, not a dispatch —
 * but it must not claim OpenHands for generic code work unless OpenHands is
 * opted in (PARIS_REPAIR_ENGINE=openhands). Without the opt-in, code work
 * falls through to ROUTER (the owned engine).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { selectMasterStudioSpecialist } from '@/lib/studio/master-runtime';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('selectMasterStudioSpecialist', () => {
  it('routes generic code work to ROUTER without the OpenHands opt-in', () => {
    vi.stubEnv('PARIS_REPAIR_ENGINE', '');
    expect(selectMasterStudioSpecialist('Refactor the TypeScript repository')).toBe('ROUTER');
    expect(selectMasterStudioSpecialist('Fix the multi-file implementation')).toBe('ROUTER');
  });

  it('routes generic code work to OPENHANDS with the explicit opt-in', () => {
    vi.stubEnv('PARIS_REPAIR_ENGINE', 'openhands');
    expect(selectMasterStudioSpecialist('Refactor the TypeScript repository')).toBe('OPENHANDS');
  });

  it('keeps non-code specialists unchanged regardless of the opt-in', () => {
    vi.stubEnv('PARIS_REPAIR_ENGINE', '');
    expect(selectMasterStudioSpecialist('Build a new course curriculum')).toBe('ELLIE');
    expect(selectMasterStudioSpecialist('Deploy the admin container')).toBe('LIZZY');
  });
});
