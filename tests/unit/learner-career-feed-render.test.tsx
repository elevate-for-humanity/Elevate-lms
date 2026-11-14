import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/require-role', () => ({
  requireRole: async () => ({ user: { id: 'learner-1' } }),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/lib/career/plan', () => ({ loadCareerPlan: async () => ({}) }));
vi.mock('@/components/career/CareerPlan', () => ({ CareerPlan: () => null }));
vi.mock('@/components/career/CareerOnboarding', () => ({
  CareerOnboarding: () => null,
}));
vi.mock('@/lib/data/jobs', () => ({
  formatSalary: () => '',
  jobTypeBadge: () => '',
  jobTypeLabel: () => 'Full time',
}));
vi.mock('@/lib/learner/career-matches', () => ({
  getLearnerCareerMatches: async () =>
    ['USAJobs.gov', 'State jobs'].map((source) => ({
      job: {
        id: 'government-one',
        title: `${source} refrigeration mechanic`,
        description: 'Maintain refrigeration systems',
        job_type: 'full_time',
        application_deadline: '2099-01-01',
      },
      source,
      applyUrl: 'https://agency.example.gov/careers',
      reasons: ['Training/skill relevance: refrigeration'],
      missingCredentials: [],
      eligibility: 'explore',
    })),
}));
import CareerPage from '../../apps/lms/app/lms/(app)/career/page';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('renders distinct provider listings with shared IDs and links without losing cards on refresh', async () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const view = render(await CareerPage());
  view.rerender(await CareerPage());
  expect(screen.getByRole('link', { name: 'USAJobs.gov refrigeration mechanic' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'State jobs refrigeration mechanic' })).toBeVisible();
  expect(screen.getAllByRole('link', { name: 'Apply Now' })).toHaveLength(2);
  for (const link of screen.getAllByRole('link', { name: 'Apply Now' })) {
    expect(link).toHaveAttribute('href', 'https://agency.example.gov/careers');
  }
  expect(errors.mock.calls.flat().join(' ')).not.toMatch(/same key|unique.*key/i);
  expect(screen.queryByText('Verified credential match')).toBeNull();
});
