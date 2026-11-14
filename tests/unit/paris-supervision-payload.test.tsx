import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ParisSupervisionPanel from '@/components/admin/ParisSupervisionPanel';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('rejects a successful HTTP response with an unrelated payload without crashing the panel', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ builds: [], acquisitions: [] }),
  }));
  render(<ParisSupervisionPanel />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid PARIS supervision response.');
  expect(screen.queryByText(/recent execution observations/)).not.toBeInTheDocument();
});

it('shows observations from a complete, well-formed supervision response', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      observedAt: '2026-10-23T18:00:00Z',
      events: [{
        id: 'event-1', operation: 'build', status: 'failed',
        created_at: '2026-10-23T17:59:00Z', next_action: 'Inspect the failed job',
      }],
      courses: [],
    }),
  }));
  render(<ParisSupervisionPanel />);
  expect(await screen.findByText(/1 recent execution observations; 1 failure or approval observations/)).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
