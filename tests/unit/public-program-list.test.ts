import { describe, expect, it } from 'vitest';
import { STATIC_PROGRAM_MAP } from '@/data/programs/index';

describe('public program catalog contract', () => {
  it('static registry has programs for marketing fallback', () => {
    expect(STATIC_PROGRAM_MAP.size).toBeGreaterThanOrEqual(25);
  });
});
