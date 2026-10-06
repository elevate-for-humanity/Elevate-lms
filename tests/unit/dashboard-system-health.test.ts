import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSystemHealth } from '@/lib/admin/dashboard/get-system-health';
import { loadQuickBooksConfig } from '@/lib/integrations/quickbooks-client';
import { loadBillingProviderConfig } from '@/lib/billing/config';

vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/integrations/quickbooks-client', () => ({ loadQuickBooksConfig: vi.fn() }));
vi.mock('@/lib/billing/config', () => ({ loadBillingProviderConfig: vi.fn() }));

const credentials = { clientId: 'private-id', clientSecret: 'private-secret', accessToken: 'private-access', refreshToken: 'private-refresh', realmId: 'private-realm' };
const tables: string[] = [];
let queryError: unknown = null;
const db = { from: (table: string) => {
  tables.push(table);
  const query = { select: () => query, eq: () => query, lt: () => query, then: (resolve: (v: unknown) => unknown) => Promise.resolve({ count: 0, error: queryError }).then(resolve) };
  return query;
} };

describe('dashboard billing health', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    tables.length = 0;
    queryError = null;
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'private-db');
    vi.stubEnv('RESEND_API_KEY', 'private-email');
    vi.stubEnv('QB_WEBHOOK_VERIFIER_TOKEN', 'private-webhook');
    vi.mocked(loadQuickBooksConfig).mockResolvedValue(credentials);
    vi.mocked(loadBillingProviderConfig).mockResolvedValue({ primary: 'quickbooks' });
  });
  it('uses canonical billing configuration and never exposes credentials', async () => {
    const health = await getSystemHealth(db as never);
    expect(health.quickBooksBillingOk).toBe(true);
    expect(health.quickBooksWebhookOk).toBe(true);
    expect(tables).not.toContain('billing_provider_config');
    expect(JSON.stringify(health)).not.toContain('private-');
  });
  it('does not report failed dependency queries as healthy', async () => {
    queryError = { message: 'private-database-error' };
    const health = await getSystemHealth(db as never);
    expect(health.degraded).toBe(true);
    expect(health.alerts.map(a => a.code)).toContain('compliance_flags_health_unavailable');
    expect(JSON.stringify(health)).not.toContain('private-database-error');
  });
  it('reports incomplete or unreadable configuration as degraded', async () => {
    vi.mocked(loadQuickBooksConfig).mockResolvedValue({ ...credentials, accessToken: '' });
    expect((await getSystemHealth(db as never)).quickBooksBillingOk).toBe(false);
    vi.mocked(loadQuickBooksConfig).mockRejectedValue(new Error('private-provider-error'));
    const health = await getSystemHealth(db as never);
    expect(health.degraded).toBe(true);
    expect(JSON.stringify(health)).not.toContain('private-provider-error');
  });
});
