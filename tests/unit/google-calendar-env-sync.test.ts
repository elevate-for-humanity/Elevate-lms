// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ save: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: async () => ({ id: 'owner-admin' }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: mocks.from, rpc: mocks.rpc }) }));
vi.mock('@/lib/secrets', () => ({ refreshSecrets: async () => {} }));
vi.mock('@/lib/google/runtime-configuration', () => ({ saveGoogleRuntimeConfiguration: mocks.save, validateRuntimeEntries: vi.fn(), GoogleConfigurationError: class extends Error {} }));
import { POST } from '@/apps/admin/app/api/admin/env-vars/route';
const pair = [{ key: 'GOOGLE_CALENDAR_CLIENT_ID', value: '484736877039-fixture.apps.googleusercontent.com' }, { key: 'GOOGLE_CALENDAR_CLIENT_SECRET', value: 'private-fixture-secret' }];
beforeEach(() => { vi.clearAllMocks(); mocks.save.mockImplementation(async component => ({ component, revision: 'verified' })); mocks.rpc.mockResolvedValue({ error: null }); mocks.from.mockReturnValue({ upsert: async () => ({ error: null }), insert: async () => ({ error: null }) }); });
it('saves and verifies one calendar credential pair on Admin and LMS without returning it', async () => {
  const response = await POST(new NextRequest('https://admin.elevateforhumanity.org/api/admin/env-vars', { method: 'POST', body: JSON.stringify({ entries: pair }) }));
  expect(response.status).toBe(200);
  expect(mocks.save).toHaveBeenCalledWith('admin', pair);
  expect(mocks.save).toHaveBeenCalledWith('lms', pair);
  expect(await response.text()).not.toContain('private-fixture-secret');
});
it('rejects partial calendar credential changes before persisting or updating a runtime', async () => {
  const response = await POST(new NextRequest('https://admin.elevateforhumanity.org/api/admin/env-vars', { method: 'POST', body: JSON.stringify({ entries: [pair[0]] }) }));
  expect(response.status).toBe(400); expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled();
});
