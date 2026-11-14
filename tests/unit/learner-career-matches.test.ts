// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  rows: {} as Record<string, any[]>,
  filters: [] as any[],
  live: vi.fn(),
  jobs: vi.fn(),
}));
vi.mock('@/lib/industry/usajobs', () => ({ fetchUsaJobs: state.live }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      const q: any = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          state.filters.push([table, key, value]);
          return q;
        },
        in: (key: string, value: unknown) => {
          state.filters.push([table, key, value]);
          return q;
        },
        or: () => q,
        is: () => q,
        order: () => q,
        limit: () => q,
        then: (resolve: any) => resolve({ data: state.rows[table] ?? [], error: null }),
      };
      return q;
    },
  }),
}));
import { getLearnerCareerMatches } from '@/lib/learner/career-matches';
const government = (id: string, title: string) => ({
  external_id: id,
  title,
  description: 'EPA 608 refrigeration maintenance',
  application_url: `https://www.usajobs.gov/job/${id}`,
  source: 'USAJobs.gov',
  closes_at: '2099-01-01',
});
beforeEach(() => {
  state.rows = {};
  state.filters = [];
  state.live.mockReset().mockResolvedValue([]);
  state.jobs.mockReset().mockResolvedValue([]);
});
it('uses a newly uploaded pending credential to find work without claiming verification', async () => {
  state.rows.student_credential_uploads = [
    { verification_status: 'pending', credential_registry: { name: 'EPA Section 608 Universal' } },
  ];
  state.live.mockResolvedValue([government('hvac', 'HVAC mechanic')]);
  const matches = await getLearnerCareerMatches('learner-1');
  expect(state.live).toHaveBeenCalledWith('HVAC technician', '', 32);
  expect(matches).toHaveLength(1);
  expect(matches[0].eligibility).toBe('explore');
  expect(matches[0].reasons.join(' ')).not.toContain('Verified credential:');
  expect(state.filters).toContainEqual(['student_credential_uploads', 'user_id', 'learner-1']);
  expect(state.filters).toContainEqual([
    'student_credential_uploads',
    'verification_status',
    ['pending', 'approved', 'verified'],
  ]);
});
it('combines live and cached jobs and deduplicates live/cache copies', async () => {
  state.rows.resumes = [
    { resume_data: { skills: ['refrigeration'], personal_info: { location: 'Indianapolis, IN' } } },
  ];
  state.live.mockResolvedValue([government('one', 'Refrigeration mechanic')]);
  state.rows.government_job_feed = [
    government('one', 'Refrigeration mechanic'),
    government('two', 'Refrigeration apprentice'),
    { ...government('old', 'Refrigeration technician'), closes_at: '2000-01-01' },
  ];
  state.jobs.mockResolvedValue([
    {
      id: 'employer',
      title: 'Refrigeration technician',
      status: 'active',
      description: 'Maintain refrigeration systems',
      required_certifications: [],
      application_deadline: null,
    },
  ]);
  const matches = await getLearnerCareerMatches('learner-1');
  expect(state.live).toHaveBeenCalledWith('refrigeration', 'Indianapolis, IN', 32);
  expect(matches.map((m) => m.job.id)).toEqual(
    expect.arrayContaining(['government-one', 'government-two']),
  );
  expect(matches).toHaveLength(2);
});
it('uses saved resume credentials as interests without treating them as verified', async () => {
  state.rows.resumes = [{ resume_data: { certifications: [{ name: 'EPA 608' }] } }];
  state.live.mockResolvedValue([government('resume', 'HVAC technician')]);
  const matches = await getLearnerCareerMatches('learner-1');
  expect(matches).toHaveLength(1);
  expect(matches[0].eligibility).toBe('explore');
});

it('prioritizes an uploaded credential occupation over a different training program', async () => {
  state.rows.student_credential_uploads = [
    { verification_status: 'approved', credential_registry: { name: 'EPA 608' } },
  ];
  state.rows.program_enrollments = [{ program_slug: 'cosmetology', title: 'Cosmetology' }];
  await getLearnerCareerMatches('learner-1');
  expect(state.live).toHaveBeenCalledWith('HVAC technician', '', 32);
});
