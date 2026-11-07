import type { SupabaseClient } from '@supabase/supabase-js';

export const CLOUD_BUDGET_NAME = 'Elevate admin cloud $90 warning';
export const CLOUD_BUDGET_KEY = 'google_cloud_budget_status';
export const CLOUD_BILLING_URL = 'https://console.cloud.google.com/billing?project=elegant-racer-299721';
const SUBSCRIPTION = 'projects/elegant-racer-299721/subscriptions/elevate-admin-cloud-budget';

export type CloudBudgetState = {
  costAmount: number; budgetAmount: number; currencyCode: 'USD';
  costIntervalStart: string; reportedAt: string; receivedAt: string;
};

// Only this configured budget can update the Admin warning. Zero is valid;
// missing, stale, foreign-currency and malformed costs never become "$0".
export function parseCloudBudget(message: { data?: string; publishTime?: string }, now = Date.now()): CloudBudgetState | null {
  try {
    const data = JSON.parse(Buffer.from(message.data ?? '', 'base64').toString('utf8'));
    const interval = Date.parse(data.costIntervalStart);
    const published = Date.parse(message.publishTime ?? '');
    const date = new Date(now);
    const month = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
    if (data.budgetDisplayName !== CLOUD_BUDGET_NAME || data.currencyCode !== 'USD' ||
        typeof data.costAmount !== 'number' || !Number.isFinite(data.costAmount) || data.costAmount < 0 ||
        data.budgetAmount !== 100 || !Number.isFinite(interval) || !Number.isFinite(published) ||
        interval < month - 86400000 || interval > month + 86400000 || published > now + 300000) return null;
    return { costAmount: data.costAmount, budgetAmount: 100, currencyCode: 'USD',
      costIntervalStart: new Date(interval).toISOString(), reportedAt: new Date(published).toISOString(),
      receivedAt: new Date(now).toISOString() };
  } catch { return null; }
}

export async function readCloudBudget(db: SupabaseClient): Promise<CloudBudgetState | null> {
  const { data, error } = await db.from('app_settings').select('value').eq('key', CLOUD_BUDGET_KEY).maybeSingle();
  if (error) throw new Error('CLOUD_BUDGET_STORAGE_UNAVAILABLE');
  if (!data?.value) return null;
  try { return JSON.parse(data.value); } catch { throw new Error('CLOUD_BUDGET_STATE_INVALID'); }
}

export async function refreshCloudBudget(db: SupabaseClient, request: typeof fetch = fetch) {
  const tokenResponse = await request('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(5000), redirect: 'error',
  });
  if (!tokenResponse.ok) throw new Error('CLOUD_BUDGET_IDENTITY_UNAVAILABLE');
  const token = await tokenResponse.json();
  if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('CLOUD_BUDGET_IDENTITY_UNAVAILABLE');
  const call = async (operation: string, body: unknown) => {
    const result = await request(`https://pubsub.googleapis.com/v1/${SUBSCRIPTION}:${operation}`, {
      method: 'POST', headers: { authorization: `Bearer ${token.access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000), redirect: 'error',
    });
    if (!result.ok) throw new Error(`CLOUD_BUDGET_${operation.toUpperCase()}_HTTP_${result.status}`);
    return operation === 'pull' ? result.json() : null;
  };
  const result = await call('pull', { maxMessages: 100, returnImmediately: true });
  const messages = result.receivedMessages ?? [];
  const valid = messages.map((row: any) => ({ state: parseCloudBudget(row.message ?? {}), ackId: row.ackId }))
    .filter((row: any) => row.state && typeof row.ackId === 'string') as Array<{ state: CloudBudgetState; ackId: string }>;
  const previous = await readCloudBudget(db);
  const next = valid.map(row => row.state).sort((a, b) => Date.parse(b.reportedAt) - Date.parse(a.reportedAt))[0];
  let state = previous;
  if (next && (!previous || Date.parse(next.reportedAt) > Date.parse(previous.reportedAt))) {
    // Compare-and-set prevents a concurrent, delayed poll overwriting newer data.
    const query = previous
      ? db.from('app_settings').update({ value: JSON.stringify(next), updated_at: new Date().toISOString() }).eq('key', CLOUD_BUDGET_KEY).eq('value', JSON.stringify(previous))
      : db.from('app_settings').upsert({ key: CLOUD_BUDGET_KEY, value: JSON.stringify(next), updated_at: new Date().toISOString() }, { onConflict: 'key', ignoreDuplicates: true });
    const { error } = await query;
    if (error) throw new Error('CLOUD_BUDGET_SAVE_FAILED');
    state = await readCloudBudget(db);
    if (!state || Date.parse(next.reportedAt) > Date.parse(state.reportedAt)) throw new Error('CLOUD_BUDGET_CONCURRENT_REFRESH_RETRY');
  }
  if (state && state.costAmount >= 90) {
    const { data: admins, error } = await db.from('profiles').select('id').in('role', ['admin', 'super_admin']);
    if (error) throw new Error('CLOUD_BUDGET_RECIPIENTS_UNAVAILABLE');
    const threshold = state.costAmount >= 100 ? 100 : 90;
    const rows = (admins ?? []).map(({ id }) => ({ user_id: id, type: 'warning',
      title: `Google Cloud spending reached $${threshold}`,
      message: `Google reports $${state!.costAmount.toFixed(2)} in this budget period. Review billing before a payment failure interrupts services. Cost reporting is delayed.`,
      action_url: CLOUD_BILLING_URL, action_label: 'Review Cloud billing',
      idempotency_key: `cloud-budget:${state!.costIntervalStart}:${threshold}:${id}`,
      metadata: { source: 'google-cloud-budget', reported_at: state!.reportedAt, threshold },
    }));
    if (rows.length) {
      const { error: saveError } = await db.from('notifications').upsert(rows, { onConflict: 'idempotency_key', ignoreDuplicates: true });
      if (saveError) throw new Error('CLOUD_BUDGET_ALERT_SAVE_FAILED');
    }
  }
  // Acknowledge only after the status and alert are durable. Provider retries
  // cannot create duplicate bell notifications or silently lose a warning.
  if (valid.length) await call('acknowledge', { ackIds: valid.map(row => row.ackId) });
  return state;
}
