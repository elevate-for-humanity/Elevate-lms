// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ allowed: true, rpc: vi.fn(), from: vi.fn(), saveGoogle: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => mocks.allowed
  ? { id: 'admin-a' }
  : { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ refreshSecrets: async () => undefined }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ rpc: mocks.rpc, from: mocks.from }) }));
vi.mock('@/lib/google/runtime-configuration', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/google/runtime-configuration')>(),
  saveGoogleRuntimeConfiguration: mocks.saveGoogle,
}));
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
  mocks.saveGoogle.mockReset().mockResolvedValue({ saved: 1, encrypted: 1, runtimeSynced: true, configurationVerified: true, runtimeSync: 'google-secret-manager', revision: 'verified-revision', message: 'Saved and verified on Google.' });
});
it('does not write any setting or credential for an unauthorized request', async () => {
  mocks.allowed = false;
  expect((await POST(request('synthetic-private-value'))).status).toBe(403);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalled();
  expect(mocks.saveGoogle).not.toHaveBeenCalled();
});
it.each(['••••••••', '********', '', '   '])('rejects masked or empty credentials before all writes (%s)', async value => {
  expect((await POST(request(value))).status).toBe(400);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalled();
  expect(mocks.saveGoogle).not.toHaveBeenCalled();
});
it('returns success only after Google confirms the runtime instead of staging a disconnected Supabase secret', async () => {
  const response = await POST(request('synthetic-private-value'));
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ saved: 1, encrypted: 1, runtimeSynced: true, configurationVerified: true, runtimeSync: 'google-secret-manager' });
  expect(JSON.stringify(body)).not.toContain('synthetic-private-value');
  expect(mocks.saveGoogle).toHaveBeenCalledWith('admin', [{ key: 'SENDGRID_API_KEY', value: 'synthetic-private-value' }]);
  expect(mocks.rpc).not.toHaveBeenCalled();
});
it('rejects a retired provider credential before audit or Google mutation', async () => {
  const req = new NextRequest('https://admin.example.test/api/admin/env-vars', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries: [{ key: 'STRIPE_SECRET_KEY', value: 'synthetic-retired-key' }] }),
  });
  expect((await POST(req)).status).toBe(400);
  expect(mocks.from).not.toHaveBeenCalled();
  expect(mocks.saveGoogle).not.toHaveBeenCalled();
});
it('does not report an unsuccessful Google write or verification as saved', async () => {
  const { GoogleConfigurationError } = await import('@/lib/google/runtime-configuration');
  mocks.saveGoogle.mockRejectedValue(new GoogleConfigurationError('permission_denied', 'secret_write'));
  const response = await POST(request('synthetic-private-value'));
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(await response.json()).toMatchObject({ configurationVerified: false, runtimeSynced: false, code: 'permission_denied' });
  expect(mocks.rpc).not.toHaveBeenCalled();
});
