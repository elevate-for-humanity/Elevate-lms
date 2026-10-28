// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPlatformHealth } from '@/lib/platform/platform-health';

const state = vi.hoisted(() => ({ settingsError: false, configured: true }));
vi.mock('@/lib/storage/lesson-media-health', () => ({ checkLessonMediaStorage: async () => ({name:'Lesson media (Backblaze B2)',status:'healthy',configured:true}) }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        limit: async () => ({ error: null }),
        in: async () => ({
          error: state.settingsError ? { message: 'private-database-detail' } : null,
          data: table === 'app_settings' && state.configured
            ? ['QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_REFRESH_TOKEN', 'QB_REALM_ID']
                .map(key => ({ key, value: 'private-credential' })) : [],
        }),
      }),
    }),
    storage: { listBuckets: async () => ({ error: null }) },
  }),
}));

describe('billing health evidence', () => {
  beforeEach(() => {
    state.settingsError = false;
    state.configured = true;
    for (const key of ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_BILLING_WEBHOOK_ID',
      'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY', 'STUDIO_BROWSER_URL', 'STUDIO_BROWSER_PUBLIC_URL',
      'STUDIO_BROWSER_SECRET', 'OPENAI_API_KEY']) vi.stubEnv(key, 'private-configuration');
    vi.stubEnv('SENDGRID_API_KEY', 'SG.private-configuration');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, json: async () => ({ browserState: 'ready', browserConnected: true }),
    }));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('keeps configured billing unverified and prevents an all-healthy summary', async () => {
    const snapshot = await getPlatformHealth();
    expect(snapshot.services.billing, snapshot.services.billing.message).toMatchObject({ configured: true, status: 'unknown' });
    expect(snapshot.overall).toBe('unknown');
    expect(snapshot.alerts).toContainEqual(expect.objectContaining({ service: 'Billing (QuickBooks + PayPal)', severity: 'info' }));
    expect(JSON.stringify(snapshot)).not.toContain('private-');
    expect(vi.mocked(fetch).mock.calls.some(([url]) => String(url).includes('intuit') || String(url).includes('paypal'))).toBe(false);
  });

  it('does not hide unreadable billing settings behind environment configuration', async () => {
    state.settingsError = true;
    const snapshot = await getPlatformHealth();
    expect(snapshot.services.billing.status).toBe('down');
    expect(snapshot.overall).toBe('degraded');
    expect(JSON.stringify(snapshot)).not.toContain('private-database-detail');
  });

  it('preserves the specific missing-provider warning', async () => {
    state.configured = false;
    const snapshot = await getPlatformHealth();
    expect(snapshot.services.billing.status).toBe('degraded');
    expect(snapshot.alerts).toContainEqual(expect.objectContaining({ message: 'Missing QuickBooks configuration' }));
  });
});
