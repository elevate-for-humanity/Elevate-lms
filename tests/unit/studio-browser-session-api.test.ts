import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: vi.fn() }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn(async () => {}) }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));
vi.mock('@/lib/devstudio/browser-configuration', () => ({
  browserConfiguration: () => ({ configured: true, internalUrl: 'https://browser.test', publicUrl: 'https://browser.test', secret: 'test-only' }),
}));
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { POST } from '@/apps/admin/app/api/admin/dev-studio/browser/session/route';

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ id: 'fixture-session' }, { status: 201 })));
});
afterEach(() => vi.unstubAllGlobals());

it.each([undefined, false, 'true'])('ignores forged fixture flags and user-editable metadata (%s)', async qa_e2e => {
  vi.mocked(apiRequireDevStudio).mockResolvedValue({
    user: { id: 'verified-admin', app_metadata: { qa_e2e }, user_metadata: { qa_e2e: true } },
  } as any);
  await POST(new NextRequest('https://admin.test/api', {
    method: 'POST', body: JSON.stringify({ ownerId: 'forged', disposableQa: true }),
  }));
  const sent = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(sent).toMatchObject({ ownerId: 'verified-admin', disposableQa: false });
});

it('marks only a server-provisioned disposable QA identity', async () => {
  vi.mocked(apiRequireDevStudio).mockResolvedValue({
    user: { id: 'qa-admin', app_metadata: { qa_e2e: true } },
  } as any);
  await POST(new NextRequest('https://admin.test/api', { method: 'POST', body: '{}' }));
  const sent = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
  expect(sent).toMatchObject({ ownerId: 'qa-admin', disposableQa: true });
});

it('never forwards fixture claims when authentication fails', async () => {
  vi.mocked(apiRequireDevStudio).mockResolvedValue({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as any);
  const response = await POST(new NextRequest('https://admin.test/api', { method: 'POST', body: '{}' }));
  expect(response.status).toBe(403);
  expect(fetch).not.toHaveBeenCalled();
});
