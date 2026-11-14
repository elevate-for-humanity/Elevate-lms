import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  db: vi.fn(),
  read: vi.fn(),
  save: vi.fn(),
  alerts: vi.fn(),
}));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: mocks.auth }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
vi.mock('@/lib/admin/service-billing', () => ({
  readServiceBilling: mocks.read,
  saveServiceBilling: mocks.save,
  refreshServiceBillingAlerts: mocks.alerts,
}));
import { GET, POST } from '@/apps/admin/app/api/admin/service-billing/route';
const request = (body: any = {}, origin = 'https://admin.elevateforhumanity.org') =>
  new NextRequest('https://admin.elevateforhumanity.org/api/admin/service-billing', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
describe('Admin service-billing authorization and writes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.mockResolvedValue({ id: 'admin' });
    mocks.db.mockResolvedValue({});
    mocks.read.mockResolvedValue([]);
    mocks.save.mockResolvedValue({ revision: 'new' });
    mocks.alerts.mockResolvedValue({ created: 0 });
  });
  it('denies non-administrators before reading financial records or refreshing providers', async () => {
    mocks.auth.mockResolvedValue({ error: new Response('{}', { status: 403 }) });
    expect((await GET(request())).status).toBe(403);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.alerts).not.toHaveBeenCalled();
  });
  it('rejects cross-origin writes and oversized bodies before database work', async () => {
    expect((await POST(request({}, 'https://other.example'))).status).toBe(403);
    expect((await POST(request({ extra: 'x'.repeat(5000) }))).status).toBe(413);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it('reports conflicts without overwriting, leaking errors, or emitting alerts', async () => {
    mocks.save.mockRejectedValue(new Error('SERVICE_BILLING_CONFLICT'));
    expect((await POST(request())).status).toBe(409);
    expect(mocks.alerts).not.toHaveBeenCalled();
    mocks.save.mockRejectedValue(new Error('Bearer private provider credential'));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private');
  });
  it('reports notification failure separately from an already durable billing update', async () => {
    mocks.alerts.mockRejectedValue(new Error('push unavailable'));
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ record: { revision: 'new' }, alertsAvailable: false });
  });
  it('never exposes an unavailable ledger as an empty successful response', async () => {
    mocks.read.mockRejectedValue(new Error('database unavailable'));
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});
