import 'server-only';
import { resolveServerSupabaseRawEnv } from '@/lib/supabase/public-config';
import storeCommerce from '@/config/store-commerce.json';

export const STORE_LEDGER_URL = storeCommerce.paymentReceiptUrl;
const endpoint = STORE_LEDGER_URL;
/** Store owns the receipt transaction. Its backend re-reads the immutable paid invoice through a service-only source RPC; no caller-supplied entitlement data is accepted. */
export async function recordStoreSubscriptionPayment(
  invoiceId: string,
  request: typeof fetch = fetch,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(invoiceId))
    throw Error('Store invoice identifier is invalid.');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (resolveServerSupabaseRawEnv().url !== 'https://cuxzzpsyufcewtmicszk.supabase.co' || !key)
    throw Error('Store payment verification configuration is unavailable.');
  const response = await request(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_id: invoiceId }),
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.subscription_id || ''))
    throw Error('Store database has not confirmed subscription delivery.');
  return { subscriptionId: body.subscription_id, replayed: body.replayed === true };
}
