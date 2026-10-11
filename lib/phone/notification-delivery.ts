import 'server-only';

export type PhoneDeliveryResult = {
  accepted: boolean;
  providerMessageId?: string;
  acceptedDeviceCount?: number;
};

/** Durable claim precedes any send. Duplicate webhooks cannot resend a message.
 * A crash/timeout leaves processing or review_required evidence, never success.
 * A provider receipt is acceptance, not proof that a recipient read the message.
 */
export async function deliverPhoneNotification(
  db: any,
  identity: { taskId: string; profileId: string; kind: 'paris' | 'voicemail'; channel: 'email' | 'sms' | 'push' },
  send: () => Promise<PhoneDeliveryResult>,
): Promise<'accepted' | 'duplicate' | 'review_required'> {
  const { data, error } = await db.from('phone_notification_deliveries').insert({
    task_id: identity.taskId, recipient_profile_id: identity.profileId,
    message_kind: identity.kind, channel: identity.channel, status: 'processing',
  }).select('id').single();
  if (error?.code === '23505') return 'duplicate';
  if (error || !data?.id) throw new Error('Phone notification claim unavailable');
  try {
    const result = await send();
    if (!result.accepted) throw new Error('Phone notification acceptance unconfirmed');
    const { data: saved, error: saveError } = await db.from('phone_notification_deliveries').update({
      status: 'accepted', provider_message_id: result.providerMessageId || null,
      accepted_device_count: result.acceptedDeviceCount ?? null,
      outcome_code: 'provider_accepted', finished_at: new Date().toISOString(),
    }).eq('id', data.id).eq('status', 'processing').select('id').single();
    if (saveError || !saved?.id) throw new Error('Phone notification outcome unavailable');
    return 'accepted';
  } catch {
    const { error: reviewError } = await db.from('phone_notification_deliveries').update({
      status: 'review_required', outcome_code: 'acceptance_requires_reconciliation',
      finished_at: new Date().toISOString(),
    }).eq('id', data.id).eq('status', 'processing');
    if (reviewError) throw new Error('Phone notification review state unavailable');
    return 'review_required';
  }
}
