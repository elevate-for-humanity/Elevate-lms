import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Admin MFA middleware policy', () => {
  const middlewareSource = readFileSync(
    join(process.cwd(), 'apps/admin/middleware.ts'),
    'utf8',
  );

  it('uses the canonical MFA enforcement switch before redirecting privileged users', () => {
    expect(middlewareSource).toContain('privilegedMfaEnforcementEnabled');
    expect(middlewareSource).toContain(
      "if (privilegedMfaEnforcementEnabled() && privileged && pathname !== '/mfa')",
    );
  });

  it('keeps MFA disabled as a global dashboard gate', () => {
    const policySource = readFileSync(
      join(process.cwd(), 'lib/auth/privileged-mfa.ts'),
      'utf8',
    );

    expect(policySource).toMatch(
      /function privilegedMfaEnforcementEnabled\(\): boolean \{\s*return false;/,
    );
  });
});
