import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { UltimateBuildPanel } from '@/components/admin/course-builder/UnifiedCourseBuilder';
vi.mock('@/components/admin/course-builder/CredentialRegistryPanel', () => ({
  default: () => null,
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function show(jobStatus: string, buildStatus = 'running') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        builds: [
          {
            id: 'existing-build',
            course_id: 'course',
            status: buildStatus,
            current_step: 'visual_assignment',
            ultimate_build_jobs: [
              {
                id: 'persisted-job',
                status: jobStatus,
                created_at: '2026-10-03T00:00:00Z',
                heartbeat_at: new Date().toISOString(),
                lease_expires_at: new Date(Date.now()+300_000).toISOString(),
                last_error: jobStatus === 'failed' ? 'SCENE_COVERAGE_REQUIRED' : null,
              },
            ],
          },
        ],
        acquisitions: [],
      }),
    }),
  );
  render(
    <UltimateBuildPanel
      course={{ id: 'course', title: 'Existing course', slug: 'course' }}
      programSlug="program"
    />,
  );
}

it('shows a failed durable job and allows resuming an existing build whose aggregate state still says running', async () => {
  show('failed');
  expect(await screen.findByText('failed · persisted-job')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Resume Ultimate build' })).toBeEnabled();
  expect(screen.getByRole('alert')).toHaveTextContent('SCENE_COVERAGE_REQUIRED');
  expect(screen.queryByRole('button', { name: 'Ultimate build running' })).not.toBeInTheDocument();
});

it('prevents another start while the durable worker job is running', async () => {
  show('running');
  expect(await screen.findByText('running · persisted-job')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Ultimate build running' })).toBeDisabled();
});

it('starts the Google worker for the existing queued build without creating a duplicate course build', async () => {
  show('queued');
  expect(await screen.findByText('queued · persisted-job')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Start Google worker' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/ultimate-course-builder/run', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ buildId: 'existing-build' }),
  }));
  expect(vi.mocked(fetch).mock.calls.filter(([url, options]) => url === '/api/admin/ultimate-course-builder' && options?.method === 'POST')).toHaveLength(0);
});

it('does not present a completed worker job as a completed course or offer publication before acceptance', async () => {
  show('completed');
  expect(await screen.findByText(/This worker job finished/)).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Publish Ultimate release' }),
  ).not.toBeInTheDocument();
});
