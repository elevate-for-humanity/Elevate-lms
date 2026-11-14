import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn(), read: vi.fn(), refresh: vi.fn(), cron: vi.fn() }));
const service = vi.hoisted(() => ({ refresh: vi.fn().mockResolvedValue({ created: 0, pushAcceptedDevices: 0 }) }));
vi.mock('@/lib/admin/service-billing', () => ({ refreshServiceBillingAlerts: service.refresh }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: mocks.auth }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
vi.mock('@/lib/gcp/cloud-budget', () => ({ readCloudBudget: mocks.read, refreshCloudBudget: mocks.refresh }));
vi.mock('@/lib/server/cron-auth', () => ({ isAuthorizedCronRequest: mocks.cron }));
import { GET } from '@/apps/admin/app/api/admin/cloud-budget/route';
import { GET as poll } from '@/apps/admin/app/api/cron/cloud-budget/route';

describe('cloud spending status boundaries', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({ id: 'owner' }); mocks.cron.mockReturnValue(true); mocks.db.mockResolvedValue({}); });
  it('rejects dashboard and scheduler callers before accessing billing state', async () => {
    mocks.auth.mockResolvedValue({ error: new Response('{}', { status: 403 }) });
    mocks.cron.mockReturnValue(false);
    expect((await GET({} as any)).status).toBe(403);
    expect((await poll({} as any)).status).toBe(401);
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
  it('distinguishes missing data from a genuine zero-dollar report', async () => {
    mocks.read.mockResolvedValue(null);
    const missing = await GET({} as any);
    expect((await missing.json()).state).toBeNull();
    expect(missing.headers.get('cache-control')).toBe('private, no-store');
    mocks.read.mockResolvedValue({ costAmount: 0 });
    expect((await (await GET({} as any)).json()).state.costAmount).toBe(0);
  });
  it('does not expose provider credentials when polling fails', async () => {
    mocks.refresh.mockRejectedValue(new Error('Bearer private-token provider body'));
    const response = await poll({} as any);
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"error":"CLOUD_BUDGET_UNAVAILABLE"}');
    expect(service.refresh).toHaveBeenCalled();
  });
});
