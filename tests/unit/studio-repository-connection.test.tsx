import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import DevStudioEditorWorkspace from '@/components/studio/DevStudioEditorWorkspace';
vi.mock('next/dynamic', () => ({ default: () => () => <div>Editor</div> }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('shows checkout drift and synchronizes through the existing runtime before refreshing status', async () => {
  let synced = false;
  const remote = 'b'.repeat(40);
  const fetcher = vi.fn(async (url: string, options: RequestInit = {}) => {
    if (url.endsWith('/runtime')) {
      expect(JSON.parse(String(options.body)).operation).toBe('repository-sync');
      synced = true;
      return Response.json({ ok: true });
    }
    return Response.json({
      tree: [],
      branch: 'main',
      commitSha: synced ? remote : 'a'.repeat(40),
      remoteCommitSha: remote,
    });
  });
  vi.stubGlobal('fetch', fetcher);
  render(<DevStudioEditorWorkspace />);
  expect(await screen.findByText(/differs from container/)).toBeInTheDocument();
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sync container with main' }));
  });
  expect(await screen.findByText(/matches container/)).toBeInTheDocument();
  expect(screen.getByText(/Container synchronized/)).toBeInTheDocument();
});
it('keeps a failed status refresh visible after an otherwise successful sync', async () => {
  let synced = false;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('/runtime')) {
        synced = true;
        return Response.json({ ok: true });
      }
      return synced
        ? Response.json({ error: 'Cannot read repository revision' }, { status: 503 })
        : Response.json({ tree: [], branch: 'main' });
    }),
  );
  render(<DevStudioEditorWorkspace />);
  await screen.findByText(/Repository main revision could not be verified/);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sync container with main' }));
  });
  expect(await screen.findByText('Cannot read repository revision')).toBeInTheDocument();
  expect(screen.queryByText(/Container synchronized/)).not.toBeInTheDocument();
});
