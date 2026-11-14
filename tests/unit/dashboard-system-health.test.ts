import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSystemHealth } from '@/lib/admin/dashboard/get-system-health';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';
import { loadBillingProviderConfig } from '@/lib/billing/config';

vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/integrations/quickbooks-client', () => ({ loadQuickBooksConfig: vi.fn(), quickBooksRequest: vi.fn() }));
vi.mock('@/lib/billing/config', () => ({ loadBillingProviderConfig: vi.fn() }));

const credentials = {
  clientId: 'private-id',
  clientSecret: 'private-secret',
  accessToken: 'private-access',
  refreshToken: 'private-refresh',
  realmId: 'private-realm',
};
const tables: string[] = [];
const filters: Array<{ table: string; expression: string }> = [];
let queryError: unknown = null;
const db = {
  from: (table: string) => {
    tables.push(table);
    const query = {
      select: () => query,
      eq: () => query,
      lt: () => query,
      or: (expression: string) => {
        filters.push({ table, expression });
        return query;
      },
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ count: 0, error: queryError }).then(resolve),
    };
    return query;
  },
};

describe('dashboard billing health', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    tables.length = 0;
    filters.length = 0;
    queryError = null;
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'private-db');
    vi.stubEnv('SENDGRID_API_KEY', 'private-email');
    vi.stubEnv('QB_WEBHOOK_VERIFIER_TOKEN', 'private-webhook');
    vi.stubEnv('QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN', '');
    vi.mocked(loadQuickBooksConfig).mockResolvedValue(credentials);
    vi.mocked(quickBooksRequest).mockReset().mockResolvedValue({CompanyInfo:{CompanyName:'Authorized company'}});
    vi.mocked(loadBillingProviderConfig).mockResolvedValue({ primary: 'quickbooks' });
  });
  it('uses canonical billing configuration and never exposes credentials', async () => {
    const health = await getSystemHealth(db as never);
    expect(health.quickBooksBillingOk).toBe(true);
    expect(health.quickBooksWebhookOk).toBe(true);
    expect(tables).not.toContain('billing_provider_config');
    expect(JSON.stringify(health)).not.toContain('private-');
  });
  it('accepts the verifier name saved by Environment Manager and used by the webhook handler', async () => {
    vi.stubEnv('QB_WEBHOOK_VERIFIER_TOKEN', '');
    vi.stubEnv('QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN', 'private-existing-verifier');
    const health = await getSystemHealth(db as never);
    expect(health.quickBooksWebhookOk).toBe(true);
    expect(health.alerts.some(a => a.code === 'quickbooks_webhook_config_missing')).toBe(false);
    expect(JSON.stringify(health)).not.toContain('private-existing-verifier');
  });
  it('allows the shared client to recover a missing access token with a saved refresh token', async () => {
    vi.mocked(loadQuickBooksConfig).mockResolvedValue({ ...credentials, accessToken: '' });
    expect((await getSystemHealth(db as never)).quickBooksBillingOk).toBe(true);
    expect(quickBooksRequest).toHaveBeenCalled();
  });
  it('checks SendGrid without requiring retired Resend', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    expect((await getSystemHealth(db as never)).buildEnvOk).toBe(true);
    vi.stubEnv('SENDGRID_API_KEY', '');
    const health = await getSystemHealth(db as never);
    expect(health.buildEnvOk).toBe(false);
    expect(health.alerts.find((a) => a.code === 'missing_env_vars')?.message).toContain(
      'SENDGRID_API_KEY',
    );
  });
  it('does not report failed dependency queries as healthy', async () => {
    queryError = { message: 'private-database-error' };
    const health = await getSystemHealth(db as never);
    expect(health.degraded).toBe(true);
    expect(health.alerts.map((a) => a.code)).toContain('compliance_flags_health_unavailable');
    expect(JSON.stringify(health)).not.toContain('private-database-error');
  });
  it('reports incomplete or unreadable configuration as degraded', async () => {
    vi.mocked(loadQuickBooksConfig).mockResolvedValue({ ...credentials, refreshToken: '' });
    expect((await getSystemHealth(db as never)).quickBooksBillingOk).toBe(false);
    vi.mocked(loadQuickBooksConfig).mockRejectedValue(new Error('private-provider-error'));
    const health = await getSystemHealth(db as never);
    expect(health.degraded).toBe(true);
    expect(JSON.stringify(health)).not.toContain('private-provider-error');
  });

  it('includes missing document states and expired or missing Course Builder leases in health checks', async () => {
    await getSystemHealth(db as never);
    expect(filters.find((f) => f.table === 'program_enrollments')?.expression).toBe(
      'docs_verified.is.null,docs_verified.eq.false',
    );
    expect(filters.find((f) => f.table === 'ultimate_build_jobs')?.expression).toContain(
      'lease_expires_at.is.null,lease_expires_at.lt.',
    );
    expect(filters.find((f) => f.table === 'ultimate_build_jobs')?.expression).toContain(
      'heartbeat_at.is.null,heartbeat_at.lt.',
    );
  });
  it('requires a successful company lookup rather than credential presence', async () => {
    vi.mocked(quickBooksRequest).mockRejectedValue(new Error('provider rejected token'));
    expect((await getSystemHealth(db as never)).quickBooksBillingOk).toBe(false);
    vi.mocked(quickBooksRequest).mockResolvedValue({});
    expect((await getSystemHealth(db as never)).quickBooksBillingOk).toBe(false);
  });

});
