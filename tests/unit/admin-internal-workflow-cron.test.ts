import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const sessionClient = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api/admin-ip-guard', () => ({ checkAdminIP: () => null }));
vi.mock('@/lib/supabase/middleware', () => ({
  hasSupabaseAuthCookie: () => false,
  createMiddlewareSupabaseClient: sessionClient,
}));

import { middleware } from '@/apps/admin/middleware';

const routes = [
  '/api/internal/ai-operator',
  '/api/internal/workflow-event-processor',
  '/api/internal/workflow-schedule-processor',
  '/api/internal/orchestration/process',
];

describe('authenticated internal workflow scheduler requests', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test-scheduler-credential');
    sessionClient.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(routes)('admits a scheduler POST to %s without a browser session', async (route) => {
    const response = await middleware(new NextRequest(`https://admin.example.test${route}`, {
      method: 'POST', headers: { authorization: 'Bearer test-scheduler-credential' },
    }));
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(sessionClient).not.toHaveBeenCalled();
  });

  it.each(routes)('rejects a missing or wrong scheduler credential at %s', async (route) => {
    for (const authorization of ['', 'Bearer wrong-credential', 'test-scheduler-credential']) {
      const response = await middleware(new NextRequest(`https://admin.example.test${route}`, {
        method: 'POST', headers: { authorization },
      }));
      expect(response.status).toBe(401);
    }
  });

  it('rejects empty configuration, adjacent routes and GET requests', async () => {
    for (const route of ['/api/internal/ai-operator/anything', '/api/internal/ai-operator-other', '/api/internal/admin']) {
      const response = await middleware(new NextRequest(`https://admin.example.test${route}`, {
        method: 'POST', headers: { authorization: 'Bearer test-scheduler-credential' },
      }));
      expect(response.status).toBe(401);
    }
    const get = await middleware(new NextRequest('https://admin.example.test/api/internal/ai-operator', {
      headers: { authorization: 'Bearer test-scheduler-credential' },
    }));
    expect(get.status).toBe(401);
    vi.stubEnv('CRON_SECRET', '');
    const unconfigured = await middleware(new NextRequest('https://admin.example.test/api/internal/ai-operator', {
      method: 'POST', headers: { authorization: 'Bearer ' },
    }));
    expect(unconfigured.status).toBe(401);
  });
});
