import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import RealRepoWorkspace from '@/components/studio/RealRepoWorkspace';

const terminalKey = 'elevate.studio.terminal.v1';
const filesUrl = '/api/admin/dev-studio/files?source=container';
const tree = { tree: [{ name: 'app.ts', path: 'app.ts', type: 'file' }], repo: 'fixture', branch: 'main' };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
beforeEach(() => window.sessionStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Repository workspace initialization', () => {
  it('waits for repository synchronization before requesting the file tree', async () => {
    let finishSync!: (response: Response) => void;
    const sync = new Promise<Response>(resolve => { finishSync = resolve; });
    const fetcher = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === filesUrl) return Promise.resolve(response(tree));
      if (url.includes('terminal-output')) return Promise.resolve(response({ state: 'running', output: [], cursor: 0 }));
      const body = JSON.parse(String(init?.body || '{}'));
      if (body.operation === 'repository-sync') return sync;
      if (body.operation === 'terminal-create') return Promise.resolve(response({ id: 'fixture-terminal' }));
      throw new Error('Unexpected repository fixture request');
    });
    vi.stubGlobal('fetch', fetcher);
    render(<RealRepoWorkspace />);
    await waitFor(() => expect(fetcher.mock.calls.some(([, init]) => String(init?.body).includes('repository-sync'))).toBe(true));
    expect(fetcher.mock.calls.some(([url]) => url === filesUrl)).toBe(false);
    await act(async () => { finishSync(response({ ok: true })); });
    expect(await screen.findByRole('button', { name: 'app.ts', exact: true })).toBeInTheDocument();
  });

  it('restores file access even when the saved terminal needs an explicit resume', async () => {
    window.sessionStorage.setItem(terminalKey, 'fixture-interrupted');
    const fetcher = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url === filesUrl) return Promise.resolve(response(tree));
      if (url.includes('terminal-output')) return Promise.resolve(response({ state: 'interrupted', output: [], cursor: 0 }));
      throw new Error('A restored terminal must not repeat repository mutations or commands');
    });
    vi.stubGlobal('fetch', fetcher);
    render(<RealRepoWorkspace />);
    expect(await screen.findByRole('button', { name: 'app.ts', exact: true })).toBeInTheDocument();
    expect(fetcher.mock.calls.every(([url]) => url === filesUrl || String(url).includes('terminal-output'))).toBe(true);
  });

  it('does not list files or create a terminal after authentication is rejected', async () => {
    const fetcher = vi.fn(() => Promise.resolve(response({ error: 'AUTH_REQUIRED' }, 401)));
    vi.stubGlobal('fetch', fetcher);
    render(<RealRepoWorkspace />);
    expect(await screen.findByText(/Runtime unavailable: AUTH_REQUIRED/)).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'app.ts', exact: true })).not.toBeInTheDocument();
  });

  it.each([401, 403])('suspends saved-terminal polling on HTTP %s and preserves its recovery ID', async (status) => {
    vi.useFakeTimers();
    window.sessionStorage.setItem(terminalKey, 'saved-auth-terminal');
    const fetcher = vi.fn(() => Promise.resolve(response({ error: 'AUTH_REQUIRED' }, status)));
    vi.stubGlobal('fetch', fetcher);
    render(<RealRepoWorkspace />);
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(terminalKey)).toBe('saved-auth-terminal');
    expect(screen.getByText(/Runtime unavailable: AUTH_REQUIRED/)).toBeInTheDocument();
  });
});
