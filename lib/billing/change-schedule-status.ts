import { hasVerifiedRecurringRelease } from './recurring-release';
import 'server-only';
import { createHash } from 'node:crypto';
import { payPalRequest } from '@/lib/integrations/paypal-client';

type Status = 'active' | 'paused' | 'completed' | 'canceled';

/** Provider collection must change before the local dashboard reports success. */
export async function changeBillingScheduleStatus(db: any, id: string, next: Status) {
  const { data: schedule, error } = await db.from('billing_schedules').select('id,status,amount_cents,cadence,customer_email,collection_mode,collection_provider,provider_subscription_id,updated_at').eq('id', id).eq('provider', 'quickbooks').maybeSingle();
  if (error || !schedule) throw new Error('Billing schedule could not be loaded.');
  const update: Record<string, unknown> = { status: next, updated_at: new Date().toISOString() };
  if (next === 'active' && ['canceled', 'completed'].includes(schedule.status)) throw new Error('An ended schedule cannot be resumed. Review a new agreement.');
  if (schedule.collection_mode === 'automatic' && !schedule.provider_subscription_id) {
    if (next === 'active' || next === 'completed') throw new Error('No PayPal agreement is linked. Complete setup before enabling collection.');
    if (next === 'canceled') update.provider_status = 'canceled';
  }
  if (schedule.collection_mode === 'automatic' && schedule.provider_subscription_id) {
    if (next === 'completed') throw new Error('Automatic subscriptions complete only after the agreed payment cycles, or must be canceled with the provider.');
    if (schedule.collection_provider !== 'paypal' || !schedule.provider_subscription_id) throw new Error('No PayPal billing agreement is linked. Complete setup before managing automatic collection.');
    if (next === 'active') {
      if (!await hasVerifiedRecurringRelease(db, schedule)) throw new Error('An approved signed recurring-payment release is required before collection resumes.');
    }
    const path = `/v1/billing/subscriptions/${encodeURIComponent(schedule.provider_subscription_id)}`;
    const actual = await payPalRequest<{status: string}>(path, { method: 'GET' });
    const desired = next === 'active' ? 'ACTIVE' : next === 'paused' ? 'SUSPENDED' : 'CANCELLED';
    if (actual.status !== desired) {
      if (['CANCELLED', 'EXPIRED'].includes(actual.status)) throw new Error('This PayPal agreement has ended and cannot resume.');
      if (next !== 'canceled' && !['ACTIVE', 'SUSPENDED'].includes(actual.status)) throw new Error('The payer must finish PayPal approval before this agreement can be paused or resumed.');
      const action = next === 'active' ? 'activate' : next === 'paused' ? 'suspend' : 'cancel';
      await payPalRequest(`${path}/${action}`, { method: 'POST', body: JSON.stringify({ reason: `Elevate administrator requested ${next} collection` }) }, createHash('sha256').update(`${id}:${schedule.updated_at}:${action}`).digest('hex'));
      const verified = await payPalRequest<{status: string}>(path, { method: 'GET' });
      if (verified.status !== desired) throw new Error('PayPal has not confirmed the requested collection change. Refresh before retrying.');
    }
    update.provider_status = next === 'active' ? 'active' : next === 'paused' ? 'suspended' : 'canceled';
    update.last_provider_sync_at = new Date().toISOString();
  }
  const saved = await db.from('billing_schedules').update(update).eq('id', id).eq('updated_at', schedule.updated_at).select('id').maybeSingle();
  if ((saved.error || !saved.data) && next === 'active' && schedule.collection_mode === 'automatic') {
    try { await payPalRequest(`/v1/billing/subscriptions/${encodeURIComponent(schedule.provider_subscription_id)}/suspend`, { method: 'POST', body: JSON.stringify({ reason: 'Local authorization state could not be saved after resume' }) }); }
    catch { throw new Error('PayPal may be active but the local save failed. Check the agreement in PayPal immediately before retrying.'); }
  }
  if (saved.error || !saved.data) throw new Error('The provider state changed but the local schedule could not be saved. Refresh and reconcile before retrying.');
  return { ok: true };
}
