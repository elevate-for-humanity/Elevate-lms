import 'server-only';
import { randomUUID } from 'node:crypto';
import type { TelnyxCallEvent } from '@/lib/phone/telnyx';

/** A successful HTTP response must not conceal a rejected/no-op state write. */
export async function persistPhoneRow(query: any): Promise<void> {
  const { data, error } = await query.select('id').single();
  if (error || !data?.id) throw new Error('Phone state persistence unavailable');
}

/** Keep the original receipt on failure. Handler retries must retain event-derived
 * provider command IDs and durable notification claims. Unknown worker outcomes
 * are held for reconciliation, never acknowledged as completed or auto-replayed.
 */
export async function processTelnyxEvent(
  db: any,
  event: TelnyxCallEvent,
  context: { system: { id: string }; call?: { id: string } | null },
  handle: () => Promise<void>,
): Promise<'completed' | 'duplicate'> {
  const token = randomUUID();
  const { data, error } = await db.rpc('claim_telnyx_call_event', {
    p_phone_system_id: context.system.id,
    p_call_id: context.call?.id ?? null,
    p_event_id: event.data.id,
    p_event_type: event.data.event_type,
    p_occurred_at: event.data.occurred_at,
    p_payload: event.data.payload,
    p_token: token,
  });
  const claim = data?.[0];
  if (error || !claim?.event_id) throw new Error('Event claim unavailable');
  if (claim.claim_status === 'duplicate') return 'duplicate';
  if (claim.claim_status !== 'claimed') throw new Error('Event processing requires retry or review');
  const finish = async (state: 'completed' | 'failed') => {
    const { data: saved, error: saveError } = await db.from('phone_call_events').update({
      processing_state: state,
      processing_finished_at: new Date().toISOString(),
      processing_outcome_code: state === 'completed' ? 'handler_completed' : 'handler_failed',
    }).eq('id', claim.event_id).eq('processing_token', token)
      .eq('processing_state', 'processing').select('id').single();
    if (saveError || !saved?.id) throw new Error('Event outcome unavailable');
  };
  try {
    await handle();
  } catch {
    await finish('failed');
    throw new Error('Event handler failed');
  }
  // An uncertain completion write must not enable automatic replay.
  await finish('completed');
  return 'completed';
}
