import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/devstudio/api-auth', () => ({
  apiRequireDevStudio: vi.fn(async () => ({ user: { id: 'admin' }, error: null })),
}));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));
import { POST } from '@/apps/admin/app/api/admin/dev-studio/browser/session/route';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
async function verify() {
  vi.stubEnv('STUDIO_BROWSER_URL', 'http://worker.internal');
  vi.stubEnv('STUDIO_BROWSER_PUBLIC_URL', 'https://worker.example');
  vi.stubEnv('STUDIO_BROWSER_SECRET', 'test-only-secret');
  return POST(
    new NextRequest('https://admin.example/api/admin/dev-studio/browser/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'verify' }),
    }),
  );
}

describe('browser verification evidence', () => {
  it('preserves the failed check instead of disguising it as a transport error', async () => {
    const evidence = {
      passed: false,
      checks: [{ name: 'keyboard_and_pointer', passed: false, reason: 'input mismatch' }],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(evidence), { status: 422 })),
    );
    const response = await verify();
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual(evidence);
  });
  it('reports occupied browser slots as a concrete failed check', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'session_capacity_reached' }), { status: 429 }),
      ),
    );
    const response = await verify();
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.passed).toBe(false);
    expect(body.checks[0].reason).toContain('slots are occupied');
  });
  it('reports timeout as failed verification with no invented pass', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('timed out', 'TimeoutError');
      }),
    );
    const response = await verify();
    expect(response.status).toBe(504);
    expect((await response.json()).checks).toEqual([
      expect.objectContaining({
        name: 'worker_verification',
        passed: false,
        reason: expect.stringContaining('two minutes'),
      }),
    ]);
  });
  it('rejects a successful HTTP response without actual browser evidence', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>sign in</html>', { status: 200 })),
    );
    const response = await verify();
    expect(response.status).toBe(502);
    expect((await response.json()).passed).toBe(false);
  });
});
