import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  role: 'instructor',
  memberships: ['instructor', 'student'],
  signedIn: true,
  profileError: false,
  enrollmentError: false,
  programSlug: 'hvac-technician',
  records: [] as Array<Record<string, unknown>>,
}));
vi.mock('@/lib/admin/guards', async () => {
  const { hasAnyRole } = await import('@/lib/rbac/role-matrix');
  return { apiRequireRoles: async (_req: Request, roles: string[], options: { adminOverride?: boolean }) => {
    if (!state.signedIn) return { error: new Response('Not authenticated', { status: 401 }) };
    return hasAnyRole(state.memberships, roles, options)
      ? { id: 'learner', effectiveRoles: state.memberships }
      : { error: new Response('Forbidden', { status: 403 }) };
  } };
});
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: async () => ({ data: { user: state.signedIn ? { id: 'learner', email: 'qa@example.invalid', user_metadata: {} } : null } }) },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({
    data: { role: state.role, full_name: 'QA Learner' },
    error: state.profileError ? { message: 'offline' } : null,
  }) }) }) }),
}) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/enrollments/getUserEnrollments', () => ({ getUserEnrollments: async () => ({
  error: state.enrollmentError ? 'offline' : null,
  enrollments: [{ source_table: 'program_enrollments', status: 'active', program_slug: state.programSlug }],
}) }));
vi.mock('@/lib/legal/recordAgreementAcceptance', () => ({ recordAgreementAcceptance: async (record: Record<string, unknown>) => {
  state.records.push(record); return { success: true };
} }));
import { POST } from '@/apps/lms/app/api/onboarding/accept-agreement/route';
const accept = (agreement_type = 'handbook', document_version = '1.0') => POST(new NextRequest('http://localhost/api/onboarding/accept-agreement', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ agreement_type, document_version }),
}));
beforeEach(() => {
  state.role = 'instructor'; state.memberships = ['instructor', 'student']; state.signedIn = true;
  state.profileError = false; state.enrollmentError = false; state.programSlug = 'hvac-technician'; state.records = [];
});

describe('learner agreement acceptance requires actual learner membership', () => {
  it.each(['instructor', 'program_holder', 'employer', 'staff'])('accepts the student handbook for dual-role %s while preserving employment audit role', async role => {
    state.role = role; state.memberships = [role, 'student'];
    expect((await accept()).status).toBe(200);
    expect(state.records).toHaveLength(1);
    expect(state.records[0]).toMatchObject({ userId: 'learner', userRole: role, agreementType: 'handbook', context: 'learner_portal' });
  });
  it.each(['instructor', 'program_holder', 'employer', 'staff', 'admin', 'super_admin'])('denies %s membership alone without creating a signature', async role => {
    state.role = role; state.memberships = [role];
    expect((await accept()).status).toBe(403);
    expect(state.records).toEqual([]);
  });
  it('accepts the primary apprenticeship program agreement for a dual-role apprentice', async () => {
    state.memberships = ['instructor', 'apprentice']; state.programSlug = 'barber-apprenticeship';
    expect((await accept('apprenticeship_agreement')).status).toBe(200);
    expect(state.records[0].agreementType).toBe('apprenticeship_agreement');
  });
  it('does not accept apprenticeship obligations for a non-apprenticeship enrollment', async () => {
    expect((await accept('apprenticeship_agreement')).status).toBe(400);
    expect(state.records).toEqual([]);
  });
  it('does not sign employment agreements through the learner endpoint', async () => {
    expect((await accept('staff_agreement')).status).toBe(400);
    expect(state.records).toEqual([]);
  });
  it('rejects a document version that is not the required version', async () => {
    expect((await accept('handbook', 'obsolete')).status).toBe(400);
    expect(state.records).toEqual([]);
  });
  it.each(['profile', 'enrollment'])('fails closed when %s verification is unavailable', async source => {
    state.profileError = source === 'profile'; state.enrollmentError = source === 'enrollment';
    expect((await accept()).status).toBe(503);
    expect(state.records).toEqual([]);
  });
  it('does not sign for anonymous sessions', async () => {
    state.signedIn = false;
    expect((await accept()).status).toBe(401);
    expect(state.records).toEqual([]);
  });
});
