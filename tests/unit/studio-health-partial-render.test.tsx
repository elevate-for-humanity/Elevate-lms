import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('next/dynamic', () => ({ default: () => () => <div>Marketing service: Running · ready</div> }));
import DevStudioHealthPanel from '@/components/studio/DevStudioHealthPanel';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('shows a timed-out probe as unverified while retaining successful runtime and service checks', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
    probes: { ai: { status: 'timed_out' }, github: { status: 'completed' }, cloudflare: { status: 'completed' } },
    hasElevate: false, hasGitHub: true, githubTokenValid: true,
    supabaseUrlPresent: true, supabaseServiceKeyPresent: true,
    execution: { ready: false, status: 'verification-incomplete', repositoryWritesReady: null },
    google: { ready: true, project: 'fixture-project', deploymentDispatchReady: null },
  })));
  render(<DevStudioHealthPanel />);
  expect(await screen.findByRole('status')).toHaveTextContent('ai: timed out');
  expect(screen.getByRole('status')).toHaveTextContent('This does not establish a service outage');
  expect(screen.getAllByText('not verified — check timed out').length).toBeGreaterThan(0);
  expect(screen.getByText('valid')).toBeInTheDocument();
  expect(screen.getByText('fixture-project')).toBeInTheDocument();
  expect(screen.getByText('Marketing service: Running · ready')).toBeInTheDocument();
  expect(screen.queryByText('invalid')).not.toBeInTheDocument();
});
