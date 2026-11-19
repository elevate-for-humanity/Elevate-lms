import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  signedIn: true,
  previewing: false,
  programSlug: 'hvac-technician',
  writes: 0,
}));
const db = vi.hoisted(() => ({
  auth: { getUser: async () => ({ data: { user: state.signedIn ? { id: 'learner' } : null } }) },
  from: (table: string) => {
    const rows: Record<string, unknown> = {
      profiles: { full_name: 'QA Learner', phone: '555-0100', orientation_completed: true },
      onboarding_progress: { profile_completed: true, completed_at: '2026-11-18T12:00:00Z' },
      enrollment_requirements: [{ id: 'requirement', status: 'verified', requirement_type: 'identity', title: 'Identity' }],
      license_agreement_acceptances: [{ agreement_type: 'enrollment', document_version: '1.0', accepted_at: '2026-11-18T12:00:00Z' }],
      digital_binders: null,
    };
    const query = {
      select: () => query, eq: () => query, order: () => query, limit: () => query,
      maybeSingle: async () => ({ data: rows[table], error: null }),
      then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data: rows[table], error: null }).then(resolve),
      insert: () => { state.writes += 1; throw new Error('Must not mutate learner records'); },
      update: () => { state.writes += 1; throw new Error('Must not mutate learner records'); },
    };
    return query;
  },
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => db }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));
vi.mock('@/lib/admin/portal-preview', () => ({ resolvePortalPreviewSubject: async () => ({ previewing: state.previewing, userId: 'selected-learner' }) }));
vi.mock('@/lib/enrollments/getUserEnrollments', () => ({ getUserEnrollments: async () => ({
  error: null,
  enrollments: [{ source_table: 'program_enrollments', enrollment_id: 'enrollment', status: 'active', program_slug: state.programSlug, course_id: 'course', continue_url: '/lms/courses/course' }],
}) }));
import { loadLearnerWorkspace } from '@/lib/learner/workspace';
import { getRequiredAgreements } from '@/lib/legal/requiredAgreements';

beforeEach(() => {
  state.signedIn = true; state.previewing = false; state.programSlug = 'hvac-technician'; state.writes = 0;
});

describe('learner participation requirements stay separate from employment agreements', () => {
  it.each(['instructor', 'program_holder', 'employer', 'staff'])('shows learner onboarding for a dual-role %s account', async role => {
    const workspace = await loadLearnerWorkspace('learner', role);
    expect(workspace.agreements.map(agreement => agreement.type)).toEqual(['enrollment', 'handbook', 'data_sharing', 'mou']);
    expect(workspace.agreements.find(agreement => agreement.type === 'enrollment')?.signed).toBe(true);
    expect(workspace.nextRequiredAction?.id).toBe('agreement:handbook');
    expect(workspace.nextRequiredAction?.href).toBe('/lms/handbook');
    expect(state.writes).toBe(0);
  });
  it.each(['student', 'learner', 'apprentice', 'barber_apprentice', 'cosmetology_apprentice'])('retains learner and apprenticeship requirements for %s', async role => {
    state.programSlug = 'barber-apprenticeship';
    const workspace = await loadLearnerWorkspace('learner', role);
    expect(workspace.agreements.map(agreement => agreement.type)).toEqual(['enrollment', 'handbook', 'data_sharing', 'mou', 'apprenticeship_agreement']);
  });
  it('preserves the separate employment agreement registry', () => {
    expect(getRequiredAgreements('instructor').map(agreement => agreement.type)).toEqual(['staff_agreement']);
    expect(getRequiredAgreements('program_holder').map(agreement => agreement.type)).toEqual(['program_holder_mou']);
    expect(getRequiredAgreements('employer').map(agreement => agreement.type)).toEqual(['employer_agreement']);
  });
  it('retains identity authorization before reading another learner workspace', async () => {
    await expect(loadLearnerWorkspace('another-learner', 'instructor')).rejects.toThrow('Learner workspace access denied');
    expect(state.writes).toBe(0);
  });
  it('retains the authenticated administrator-selected preview boundary', async () => {
    state.previewing = true;
    expect((await loadLearnerWorkspace('selected-learner', 'employer')).agreements.map(agreement => agreement.type)).toContain('handbook');
  });
  it('does not admit anonymous sessions', async () => {
    state.signedIn = false;
    await expect(loadLearnerWorkspace('learner', 'instructor')).rejects.toThrow('Sign in required');
  });
});
