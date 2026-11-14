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
    {
      verification_status: 'pending',
      credential_registry: { name: 'EPA Section 608 Universal' },
    },
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
    {
      resume_data: {
        skills: ['refrigeration'],
        personal_info: { location: 'Indianapolis, IN' },
      },
    },
  ];
  state.live.mockResolvedValue([government('one', 'Refrigeration mechanic')]);
  state.rows.government_job_feed = [
    government('one', 'Refrigeration mechanic'),
    government('two', 'Refrigeration apprentice'),
    {
      ...government('old', 'Refrigeration technician'),
      closes_at: '2000-01-01',
    },
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
    {
      verification_status: 'approved',
      credential_registry: { name: 'EPA 608' },
    },
  ];
  state.rows.program_enrollments = [{ program_slug: 'cosmetology', title: 'Cosmetology' }];
  await getLearnerCareerMatches('learner-1');
  expect(state.live).toHaveBeenCalledWith('HVAC technician', '', 32);
});

it('retains a relevant cached copy when the live copy has no matching terms', async () => {
  state.rows.resumes = [{ resume_data: { skills: ['HVAC'] } }];
  state.live.mockResolvedValue([
    { ...government('same', 'Technician'), description: 'General maintenance' },
  ]);
  state.rows.government_job_feed = [
    {
      ...government('same', 'HVAC Technician'),
      description: 'HVAC installation',
    },
  ];
  const matches = await getLearnerCareerMatches('learner-1');
  expect(matches).toHaveLength(1);
  expect(matches[0].job.title).toBe('HVAC Technician');
  expect(matches[0].score).toBeGreaterThan(0);
});

it.each(['live', 'cached'] as const)(
  'keeps the highest-scoring copy when the %s listing is stronger',
  async (stronger) => {
    state.rows.resumes = [{ resume_data: { skills: ['HVAC', 'refrigeration'] } }];
    const low = {
      ...government('same', 'HVAC helper'),
      description: 'HVAC installation',
    };
    const high = {
      ...government('same', 'HVAC refrigeration technician'),
      description: 'HVAC and refrigeration installation',
    };
    state.live.mockResolvedValue([stronger === 'live' ? high : low]);
    state.rows.government_job_feed = [stronger === 'cached' ? high : low];
    const matches = await getLearnerCareerMatches('learner-1');
    expect(matches).toHaveLength(1);
    expect(matches[0].job.title).toBe(high.title);
  },
);

it('preserves distinct job identities that share a general application link', async () => {
  state.rows.resumes = [{ resume_data: { skills: ['refrigeration'] } }];
  const application_url = 'https://agency.example.gov/careers';
  state.live.mockResolvedValue([
    { ...government('one', 'Refrigeration mechanic'), application_url },
    { ...government('two', 'Refrigeration apprentice'), application_url },
  ]);
  const matches = await getLearnerCareerMatches('learner-1');
  expect(matches.map((match) => match.job.id)).toEqual(['government-one', 'government-two']);
});

it('keeps different providers with the same external ID distinct', async () => {
  state.rows.resumes = [{ resume_data: { skills: ['refrigeration'] } }];
  state.live.mockResolvedValue([government('one', 'Refrigeration mechanic')]);
  state.rows.government_job_feed = [
    { ...government('one', 'Refrigeration apprentice'), source: 'State jobs' },
  ];
  const matches = await getLearnerCareerMatches('learner-1');
  expect(matches.map((match) => match.source)).toEqual(['USAJobs.gov', 'State jobs']);
});

it('deduplicates before applying the requested limit and keeps live data on equal scores', async () => {
  state.rows.resumes = [{ resume_data: { skills: ['refrigeration'] } }];
  state.live.mockResolvedValue([government('one', 'Live refrigeration mechanic')]);
  state.rows.government_job_feed = [
    government('one', 'Cached refrigeration mechanic'),
    government('two', 'Refrigeration apprentice'),
    government('three', 'Refrigeration helper'),
  ];
  const matches = await getLearnerCareerMatches('learner-1', 2);
  expect(matches.map((match) => match.job.id)).toEqual(['government-one', 'government-three']);
  expect(matches[0].job.title).toBe('Live refrigeration mechanic');
});

it('does not let expired or unsafe copies displace an eligible cached listing', async () => {
  state.rows.resumes = [{ resume_data: { skills: ['refrigeration'] } }];
  state.live.mockResolvedValue([
    {
      ...government('same', 'Refrigeration mechanic'),
      closes_at: '2000-01-01',
    },
    {
      ...government('same', 'Refrigeration mechanic'),
      application_url: 'javascript:alert(1)',
    },
  ]);
  state.rows.government_job_feed = [government('same', 'Eligible refrigeration mechanic')];
  const matches = await getLearnerCareerMatches('learner-1');
  expect(matches).toHaveLength(1);
  expect(matches[0].job.title).toBe('Eligible refrigeration mechanic');
  expect(matches[0].applyUrl).toBe('https://www.usajobs.gov/job/same');
});
