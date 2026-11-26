import 'server-only';

export type PhoneDeliveryResult = {
  accepted: boolean;
  providerMessageId?: string;
  acceptedDeviceCount?: number;
};

/** Durable claim precedes any send. Duplicate webhooks cannot resend a message.
 * A crash/timeout leaves processing or review_required evidence, never success.
 * A provider receipt is acceptance, not proof that a recipient read the message.
 *
 * A claim whose send was definitively NOT accepted (the provider call resolved
 * with accepted=false — e.g. a capability or configuration refusal) is recorded
 * as send_not_accepted and may be re-claimed by a later attempt, so one
 * transient refusal cannot poison the (task, recipient, kind, channel) claim
 * forever. A claim whose send threw, or whose acceptance could not be
 * persisted, stays review_required with acceptance_requires_reconciliation and
 * is never resent automatically: the provider may already have accepted it.
 */
export async function deliverPhoneNotification(
  db: any,
  identity: { taskId: string; profileId: string; kind: 'paris' | 'voicemail' | 'voicemail_recording'; channel: 'email' | 'sms' | 'push' },
  send: () => Promise<PhoneDeliveryResult>,
): Promise<'accepted' | 'duplicate' | 'review_required'> {
  const { data, error } = await db.from('phone_notification_deliveries').insert({
    task_id: identity.taskId, recipient_profile_id: identity.profileId,
    message_kind: identity.kind, channel: identity.channel, status: 'processing',
  }).select('id').single();
  let claimId: string | null = null;
  if (error?.code === '23505') {
    claimId = await reclaimUnacceptedClaim(db, identity);
    if (!claimId) return 'duplicate';
  } else {
    if (error || !data?.id) throw new Error('Phone notification claim unavailable');
    claimId = data.id;
  }
  let sendResult: PhoneDeliveryResult | null = null;
  try {
    sendResult = await send();
    if (!sendResult.accepted) throw new Error('Phone notification acceptance unconfirmed');
    const { data: saved, error: saveError } = await db.from('phone_notification_deliveries').update({
      status: 'accepted', provider_message_id: sendResult.providerMessageId || null,
      accepted_device_count: sendResult.acceptedDeviceCount ?? null,
      outcome_code: 'provider_accepted', finished_at: new Date().toISOString(),
    }).eq('id', claimId).eq('status', 'processing').select('id').single();
    if (saveError || !saved?.id) throw new Error('Phone notification outcome unavailable');
    return 'accepted';
  } catch {
    const notAccepted = sendResult !== null && !sendResult.accepted;
    const { error: reviewError } = await db.from('phone_notification_deliveries').update({
      status: 'review_required',
      outcome_code: notAccepted ? 'send_not_accepted' : 'acceptance_requires_reconciliation',
      finished_at: new Date().toISOString(),
    }).eq('id', claimId).eq('status', 'processing');
    if (reviewError) throw new Error('Phone notification review state unavailable');
    return 'review_required';
  }
}

/** Re-claim a prior claim only when its send provably never reached acceptance.
 * The status/outcome guard on the update makes the flip atomic: if another
 * attempt already re-claimed or resolved the row, this returns null and the
 * caller treats the attempt as a duplicate. Any lookup failure also fails
 * closed to duplicate — never to a resend.
 */
async function reclaimUnacceptedClaim(
  db: any,
  identity: { taskId: string; profileId: string; kind: string; channel: string },
): Promise<string | null> {
  try {
    const { data: existing, error } = await db.from('phone_notification_deliveries')
      .select('id')
      .eq('task_id', identity.taskId)
      .eq('recipient_profile_id', identity.profileId)
      .eq('message_kind', identity.kind)
      .eq('channel', identity.channel)
      .eq('status', 'review_required')
      .eq('outcome_code', 'send_not_accepted')
      .single();
    if (error || !existing?.id) return null;
    const { data: reclaimed, error: reclaimError } = await db.from('phone_notification_deliveries').update({
      status: 'processing', outcome_code: null, finished_at: null,
    }).eq('id', existing.id).eq('status', 'review_required').eq('outcome_code', 'send_not_accepted')
      .select('id').single();
    if (reclaimError || !reclaimed?.id) return null;
    return reclaimed.id;
  } catch {
    return null;
  }
}

/** A recording-only outage alert must not consume the later transcript claim. */
export function phoneNotificationKind(input: {source?: 'voicemail' | 'paris';awaitingTranscript?: boolean;transcript?: string}): 'paris'|'voicemail'|'voicemail_recording' {
  return input.source==='voicemail'&&input.awaitingTranscript&&!input.transcript?.trim()
    ?'voicemail_recording':input.source||'paris';
}
