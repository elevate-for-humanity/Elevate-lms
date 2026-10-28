import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { JOB_READY_MODULES, jobReadyStatus, jobReadyProgress } from '@/lib/career/job-ready';
import { CareerPlan } from '@/components/career/CareerPlan';
import { JobReadyPlayer } from '@/components/career/JobReadyPlayer';
vi.mock('next/image', () => ({ default: () => null }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const plan = {
  credentialEarned: false,
  credentialUnavailable: false,
  resumeSaved: false,
  resumeUnavailable: false,
  jriUnavailable: false,
  jri: [],
};
it('does not treat a passed quiz without completed content as a completed module', () => {
  expect(jobReadyStatus({ 'cmi.success_status': 'passed' })).toBe('in_progress');
  expect(
    jobReadyStatus({ 'cmi.completion_status': 'completed', 'cmi.success_status': 'failed' }),
  ).toBe('failed');
  expect(
    jobReadyStatus({ 'cmi.completion_status': 'completed', 'cmi.success_status': 'passed' }),
  ).toBe('completed');
  expect(jobReadyProgress({ 'cmi.progress_measure': '0.55' })).toBeCloseTo(55);
  expect(jobReadyProgress({ 'cmi.progress_measure': 'NaN' })).toBe(0);
});
it('keeps all seven learner modules and excludes facilitator resources', () => {
  expect(JOB_READY_MODULES).toHaveLength(7);
  expect(new Set(JOB_READY_MODULES.map((m) => m.id)).size).toBe(7);
  expect(JOB_READY_MODULES.some((m) => m.slug.includes('facilitation'))).toBe(false);
});
it('offers preparation before graduation and highlights an earned credential', () => {
  const { rerender } = render(<CareerPlan plan={plan} />);
  expect(screen.getByRole('link', { name: 'Build my résumé' })).toHaveAttribute(
    'href',
    '/lms/resume-builder',
  );
  expect(screen.queryByText(/You earned your credential/)).toBeNull();
  rerender(<CareerPlan plan={{ ...plan, credentialEarned: true, resumeSaved: true }} />);
  expect(screen.getByText(/You earned your credential/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Continue Job Ready' })).toBeInTheDocument();
});
it('keeps admin previews read only', () => {
  render(<CareerPlan plan={plan} readOnly />);
  expect(screen.queryAllByRole('link')).toHaveLength(0);
});
it('hydrates resume data before initializing SCORM and persists only to the current module', async () => {
  vi.useFakeTimers();
  const fetch = vi.fn(async () => ({ ok: true }));
  vi.stubGlobal('fetch', fetch);
  render(
    <JobReadyPlayer
      slug="mindsets"
      title="Mindsets"
      learnerId="qa-learner"
      learnerName="QA Learner"
      initialCmi={{ 'cmi.location': 'slide-8', 'cmi.suspend_data': 'saved-state' }}
    />,
  );
  const api = (window as any).API_1484_11;
  expect(api.Initialize('')).toBe('true');
  expect(api.GetValue('cmi.entry')).toBe('resume');
  expect(api.GetValue('cmi.location')).toBe('slide-8');
  expect(api.SetValue('cmi.learner_id', 'another-learner')).toBe('false');
  api.SetValue('cmi.location', 'slide-9');
  api.Commit('');
  await vi.advanceTimersByTimeAsync(1);
  expect(fetch).toHaveBeenCalledWith(
    '/api/learner/job-ready/mindsets',
    expect.objectContaining({ method: 'POST', body: expect.stringContaining('slide-9') }),
  );
});
