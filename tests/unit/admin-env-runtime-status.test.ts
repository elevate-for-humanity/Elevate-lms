// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ allowed: true, rpc: vi.fn(), from: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => mocks.allowed
  ? { id: 'admin-a' }
  : { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ refreshSecrets: async () => undefined }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ rpc: mocks.rpc, from: mocks.from }) }));
import { POST } from '@/apps/admin/app/api/admin/env-vars/route';

function request(value: string) {
  return new NextRequest('https://admin.example.test/api/admin/env-vars', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries: [{ key: 'SENDGRID_API_KEY', value }] }),
  });
}
beforeEach(() => {
  mocks.allowed = true;
  mocks.rpc.mockReset().mockResolvedValue({ error: null });
  mocks.from.mockReset().mockReturnValue({ insert: async () => ({ error: null }), upsert: async () => ({ error: null }) });
});
it('does not write any setting or credential for an unauthorized request', async () => {
  mocks.allowed = false;
  expect((await POST(request('synthetic-private-value'))).status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalled();
});
it.each(['••••••••', '********', '', '   '])('rejects masked or empty credentials before all writes (%s)', async value => {
  expect((await POST(request(value))).status).toBe(400);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalled();
});
it('persists an encrypted secret while explicitly leaving Google runtime transfer unverified', async () => {
  const response = await POST(request('synthetic-private-value'));
  expect(response.status).toBe(202);
  const body = await response.json();
  expect(body).toMatchObject({ saved: 1, encrypted: 1, runtimeSynced: false, configurationVerified: false, runtimeSync: 'pending-google-secret-manager' });
  expect(JSON.stringify(body)).not.toContain('synthetic-private-value');
  expect(mocks.rpc).toHaveBeenCalledWith('set_platform_secret', expect.objectContaining({ p_key: 'SENDGRID_API_KEY', p_value: 'synthetic-private-value' }));
});
it('does not report an unsuccessful encrypted write as saved', async () => {
  mocks.rpc.mockResolvedValue({ error: { message: 'write unavailable', code: 'XX000' } });
  const response = await POST(request('synthetic-private-value'));
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(mocks.from).not.toHaveBeenCalled();
});
