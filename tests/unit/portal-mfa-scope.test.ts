import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) => readFileSync(path.resolve(relativePath), 'utf8');

describe('portal MFA scope', () => {
  it('does not globally redirect ordinary Admin dashboard navigation to an authenticator-code screen', () => {
    const middleware = source('apps/admin/middleware.ts');
    const policy = source('lib/auth/privileged-mfa.ts');

    expect(policy).toMatch(/privilegedMfaEnforcementEnabled\(\)[\s\S]*?return false;/);
    expect(middleware).toContain('privilegedMfaEnforcementEnabled() && privileged');
  });

  it('keeps learner authentication password-based and role-routes students to the LMS', () => {
    const login = source('apps/lms/app/login/page.tsx');

    expect(login).toContain("fetch('/api/auth/signin'");
    expect(login).toContain('resolveDashboardUrl(profile.role, effectiveRoles)');
    expect(login).not.toContain('/mfa');
  });
});
