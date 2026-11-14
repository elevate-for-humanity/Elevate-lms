import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isQaE2EIdentity } from '@/lib/qa/is-qa-e2e-identity';

describe('production QA notification boundary', () => {
  it('recognizes only the reserved disposable QA email domain', () => {
    expect(isQaE2EIdentity('qa-e2e-123-host@qa.invalid')).toBe(true);
    expect(isQaE2EIdentity('PERSON@QA.INVALID')).toBe(true);
    expect(isQaE2EIdentity('qa-e2e@example.com')).toBe(false);
    expect(isQaE2EIdentity('owner@elevateforhumanity.org')).toBe(false);
  });

  it('guards every E2E-triggered operational email path', () => {
    const signin = readFileSync(
      resolve(process.cwd(), 'apps/lms/app/api/auth/signin/route.ts'),
      'utf8',
    );
    const documents = readFileSync(
      resolve(process.cwd(), 'apps/lms/app/api/apprentice/documents/route.ts'),
      'utf8',
    );
    expect(signin).toContain('isQaE2EIdentity(data.user.email)');
    expect(documents).toContain('isQaE2EIdentity(user.email)');
  });
});
