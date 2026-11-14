export async function storeSmsEvent(db: any, event: any) {
  const payload = event.data.payload,
    kind = event.data.event_type;
  if (kind === 'message.received') {
    const to = payload.to?.[0]?.phone_number,
      from = payload.from?.phone_number;
    if (!to || !from || !payload.id) return;
    const { data: number } = await db
      .from('phone_numbers')
      .select('phone_system_id')
      .eq('e164', to)
      .eq('status', 'active')
      .maybeSingle();
    if (!number) return;
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
    const { data: admin } = workspace
      ? await db
          .from('communication_extensions')
          .select('profile_id')
          .eq('workspace_id', workspace.id)
          .eq('extension', '0')
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
}
