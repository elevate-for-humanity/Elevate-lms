import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COSMETOLOGY_COURSE_ID } from '@/lib/cosmetology/pricing';

const PRODUCTION_COURSE_ID = '9ca9fb50-7119-46ea-ab81-9b0193c29c31';

describe('cosmetology course identity', () => {
  it('uses the canonical production course', () => {
    expect(COSMETOLOGY_COURSE_ID).toBe(PRODUCTION_COURSE_ID);
  });

  it('keeps post-payment enrollment on the shared course constant', () => {
    const source = readFileSync('lib/enrollment/cosmetology-post-payment.ts', 'utf8');
    expect(source).toContain("import { COSMETOLOGY_COURSE_ID } from '@/lib/cosmetology/pricing'");
    expect(source).not.toContain('b427be5e-c85b-4b41-91d6-4288aec8c975');
  });
});
