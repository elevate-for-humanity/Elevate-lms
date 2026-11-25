/**
 * Stores one provider messaging event. For an inbound text it returns the
 * owning phone system and profile so callers (the Twilio webhook) can run
 * follow-ups such as the SMS auto-reply against the stored message; other
 * event kinds return null.
 */
export async function storeSmsEvent(
  db: any,
  event: any,
): Promise<{ phoneSystemId: string; ownerProfileId: string | null } | null> {
  const payload = event.data.payload,
    kind = event.data.event_type;
  if (kind === 'message.received') {
    const to = payload.to?.[0]?.phone_number,
      from = payload.from?.phone_number;
    if (!to || !from || !payload.id) return null;
    const { data: number } = await db
      .from('phone_numbers')
      .select('phone_system_id')
      .eq('e164', to)
      .eq('status', 'active')
      .maybeSingle();
    if (!number) return null;
    const { data: prior } = await db
      .from('communication_sms_messages')
      .select('owner_profile_id')
      .eq('phone_system_id', number.phone_system_id)
      .eq('direction', 'outbound')
      .eq('to_number', from)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: workspace } = await db
      .from('communication_workspaces')
      .select('id')
      .eq('phone_system_id', number.phone_system_id)
      .maybeSingle();
    // The fallback thread owner is the operator: whichever extension row the
    // phone system designates as its admin extension
    // (phone_systems.admin_extension), never a literal extension '0'.
    const { data: system } = await db
      .from('phone_systems')
      .select('admin_extension')
      .eq('id', number.phone_system_id)
      .maybeSingle();
    const adminExtension =
      typeof system?.admin_extension === 'string' && system.admin_extension.trim()
        ? system.admin_extension.trim()
        : null;
    const { data: admin } =
      workspace && adminExtension
        ? await db
            .from('communication_extensions')
            .select('profile_id')
            .eq('workspace_id', workspace.id)
            .eq('extension', adminExtension)
            .eq('enabled', true)
            .maybeSingle()
        : { data: null };
    const owner = prior?.owner_profile_id || admin?.profile_id || null;
    const { error } = await db
      .from('communication_sms_messages')
      .upsert(
        {
          phone_system_id: number.phone_system_id,
          owner_profile_id: owner,
          direction: 'inbound',
          from_number: from,
          to_number: to,
          body: payload.text || '',
          media: payload.media || [],
          status: 'received',
          provider_message_id: payload.id,
          provider_event_id: event.data.id,
        },
        { onConflict: 'provider_message_id', ignoreDuplicates: true },
      );
    if (error) throw Error('Incoming text storage failed');
    if (owner)
      await db
        .from('notifications')
        .upsert(
          {
            user_id: owner,
            type: 'message',
            title: 'New text message',
            message: `A text arrived from ${from}.`,
            action_url: 'https://app.elevateforhumanity.org/communications/texts',
            action_label: 'Read and reply',
            idempotency_key: `sms:${event.data.id}`,
            read: false,
          },
          { onConflict: 'idempotency_key', ignoreDuplicates: true },
        );
    return { phoneSystemId: number.phone_system_id, ownerProfileId: owner };
  } else if (['message.sent', 'message.finalized'].includes(kind)) {
    const status =
      payload.to?.[0]?.status || (kind === 'message.sent' ? 'sent' : 'delivery_unconfirmed');
    const { error } = await db
      .from('communication_sms_messages')
      .update({
        status,
        error_message: payload.errors?.length ? 'Provider reported a delivery error' : null,
      })
      .eq('provider_message_id', payload.id);
    if (error) throw Error('SMS receipt storage failed');
  }
  return null;
}
