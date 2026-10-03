import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/devstudio/api-auth', () => ({
  apiRequireDevStudio: vi.fn(async () => ({ id: 'admin', error: null })),
}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn(async () => undefined) }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

import { GET, POST, DELETE } from '@/apps/admin/app/api/admin/dev-studio/browser/action/route';

describe('Studio browser action proxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.STUDIO_BROWSER_URL = 'http://studio-browser.internal';
  });

  it('reads events through Admin without putting the session token in a URL', async () => {
    const workerFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ events: [] })));
    const response = await GET(new NextRequest('https://admin.example/api/admin/dev-studio/browser/action?sessionId=session_123&resource=events', {
      headers: { 'x-studio-session-token': 'fixture-token' },
    }));
    expect(response.status).toBe(200);
    expect(workerFetch).toHaveBeenCalledWith('http://studio-browser.internal/sessions/session_123/events',
      expect.objectContaining({ headers: { Authorization: 'Bearer fixture-token' } }));
  });

  it('rejects arbitrary worker resources', async () => {
    const workerFetch = vi.spyOn(globalThis, 'fetch');
    const response = await GET(new NextRequest('https://admin.example/api/admin/dev-studio/browser/action?sessionId=session_123&resource=../../workspace/files', {
      headers: { 'x-studio-session-token': 'fixture-token' },
    }));
    expect(response.status).toBe(400);
    expect(workerFetch).not.toHaveBeenCalled();
  });

  it('stops only the selected bearer-authenticated session', async () => {
    const workerFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ok: true })));
    const response = await DELETE(new NextRequest('https://admin.example/api/admin/dev-studio/browser/action?sessionId=session_123', {
      method: 'DELETE', headers: { 'x-studio-session-token': 'fixture-token' },
    }));
    expect(response.status).toBe(200);
    expect(workerFetch).toHaveBeenCalledWith('http://studio-browser.internal/sessions/session_123',
      expect.objectContaining({ method: 'DELETE', headers: { Authorization: 'Bearer fixture-token' } }));
  });

  it('sends an authenticated Admin action through the internal worker channel', async () => {
    const workerFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true, url: 'https://app.envato.com/workspaces' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const request = new NextRequest('https://admin.elevateforhumanity.org/api/admin/dev-studio/browser/action', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'session_123',
        sessionToken: 'session-token',
        action: { type: 'navigate', url: 'https://app.envato.com/workspaces' },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, url: 'https://app.envato.com/workspaces' });
    expect(workerFetch).toHaveBeenCalledWith(
      'http://studio-browser.internal/sessions/session_123/actions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
      }),
    );
  });

  it('rejects invalid session identifiers before contacting the worker', async () => {
    const workerFetch = vi.spyOn(globalThis, 'fetch');
    const request = new NextRequest('https://admin.elevateforhumanity.org/api/admin/dev-studio/browser/action', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: '../other-session',
        sessionToken: 'session-token',
        action: { type: 'navigate', url: 'https://app.envato.com/workspaces' },
      }),
      headers: { 'content-type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(workerFetch).not.toHaveBeenCalled();
  });
});
