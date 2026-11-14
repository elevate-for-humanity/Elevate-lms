import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const fetchJobs = vi.hoisted(() => vi.fn());
vi.mock('@/lib/data/jobs', () => ({
  getActiveJobs: fetchJobs,
  formatSalary: () => 'Salary not listed',
  jobTypeLabel: () => 'Full-time',
}));
import LiveJobPostings from '@/components/careers/LiveJobPostings';
afterEach(cleanup);
beforeEach(() => {
  fetchJobs.mockReset();
});
describe('live job board states', () => {
  it('gives an empty board useful destinations without a self-link loop', async () => {
    fetchJobs.mockResolvedValue([]);
    render(await LiveJobPostings({ showBoardLink: false }));
    expect(screen.getByText(/No active employer postings/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Post an opening' })).toHaveAttribute(
      'href',
      '/employers/post-job',
    );
    expect(screen.getByRole('link', { name: 'Explore participating employers' })).toHaveAttribute(
      'href',
      '/employers/directory',
    );
    expect(screen.queryByRole('link', { name: /full job board/ })).not.toBeInTheDocument();
  });
  it('distinguishes an unavailable query from a genuinely empty board', async () => {
    fetchJobs.mockRejectedValue(new Error('Unavailable'));
    render(await LiveJobPostings({ showBoardLink: false }));
    expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument();
    expect(screen.queryByText(/No active employer postings/)).not.toBeInTheDocument();
  });
  it('links a returned posting to its actual detail page', async () => {
    fetchJobs.mockResolvedValue([
      { id: 'sample-job', title: 'Barber', location: 'Indianapolis', job_type: 'full_time' },
    ]);
    render(await LiveJobPostings({}));
    expect(screen.getByRole('link', { name: /Barber/ })).toHaveAttribute(
      'href',
      '/careers/jobs/sample-job',
    );
  });
});
