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

  it('does not weaken privileged enrollment writes when restoring learner reads', () => {
    const migration = source(
      'supabase/migrations/20260824173000_allow_learners_read_own_program_enrollments.sql',
    );

    expect(migration).toContain('program_enrollments_owner_read');
    expect(migration).toContain('(SELECT auth.uid()) = COALESCE(user_id, student_id)');
    expect(migration).not.toContain('DROP POLICY IF EXISTS require_privileged_aal2');
    expect(migration).not.toContain("auth.jwt() ->> 'aal'");
  });
});
