import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  decodeCallState,
  encodeCallState,
  isOpenNow,
  menuPrompt,
  telnyxClient,
  verifyTelnyxWebhook,
  type TelnyxCallEvent,
} from '@/lib/phone/telnyx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type System = {
  id: string;
  greeting: string;
  after_hours_message: string;
  timezone: string;
  business_hours: Record<string, [string, string]>;
  routing_mode: string;
  default_destination_id: string | null;
  voicemail_enabled: boolean;
  voicemail_transcription_enabled: boolean;
  call_recording_enabled: boolean;
};

async function beginVoicemail(system: System, callControlId: string, eventId: string) {
  const client = telnyxClient();
  if (!system.voicemail_enabled) {
    await client.calls.actions.speak(callControlId, {
      payload: 'No one is available to take your call. Please try again later.',
      voice: 'Telnyx.KokoroTTS.af',
      command_id: `${eventId}-unavailable`,
    });
    return;
  }
  await client.calls.actions.speak(callControlId, {
    payload: `${system.after_hours_message} Please leave your message after the beep.`,
    voice: 'Telnyx.KokoroTTS.af',
    command_id: `${eventId}-voicemail-prompt`,
    client_state: encodeCallState({ systemId: system.id, phase: 'voicemail_prompt' }),
  });
}

async function findContext(db: any, event: TelnyxCallEvent) {
  const payload = event.data.payload;
  const state = decodeCallState(payload.client_state);
  if (state.systemId) {
    const { data: system } = await db
      .from('phone_systems')
      .select('*')
      .eq('id', state.systemId)
      .maybeSingle();
    const { data: call } = await db
      .from('phone_calls')
      .select('*')
      .eq('provider', 'telnyx')
      .eq('provider_call_id', payload.call_control_id)
      .maybeSingle();
    return { system: system as System | null, call, phoneNumber: null };
  }
  const { data: phoneNumber } = await db
    .from('phone_numbers')
    .select('id,phone_system_id')
    .eq('e164', payload.to)
    .eq('provider', 'telnyx')
    .eq('status', 'active')
    .maybeSingle();
  if (!phoneNumber) return { system: null, call: null, phoneNumber: null };
  const { data: system } = await db
    .from('phone_systems')
    .select('*')
    .eq('id', phoneNumber.phone_system_id)
    .maybeSingle();
  const { data: call } = await db
    .from('phone_calls')
    .select('*')
    .eq('provider', 'telnyx')
    .eq('provider_call_id', payload.call_control_id)
    .maybeSingle();
  return { system: system as System | null, call, phoneNumber };
}

async function transferToDestination(
  db: any,
  system: System,
  callControlId: string,
  destinationId: string,
  eventId: string,
) {
  const { data: destination } = await db
    .from('phone_destinations')
    .select('*')
    .eq('id', destinationId)
    .eq('phone_system_id', system.id)
    .eq('enabled', true)
    .maybeSingle();
  if (!destination?.destination) throw new Error('No active destination is configured.');
  await telnyxClient().calls.actions.transfer(callControlId, {
    to: destination.destination,
    command_id: `${eventId}-transfer`,
    client_state: encodeCallState({ systemId: system.id, destinationId }),
    timeout_secs: destination.ring_seconds,
    answering_machine_detection: 'disabled',
  });
}

async function handleEvent(
  db: any,
  event: TelnyxCallEvent,
  system: System,
  call: any,
  phoneNumber: any,
) {
  const { event_type: type, id: eventId } = event.data;
  const payload = event.data.payload;
  const client = telnyxClient();
  if (type === 'call.initiated' && payload.direction === 'incoming') {
    const { data: created } = await db
      .from('phone_calls')
      .upsert(
        {
          phone_system_id: system.id,
          phone_number_id: phoneNumber?.id ?? null,
          provider: 'telnyx',
          provider_call_id: payload.call_control_id,
          direction: 'inbound',
          from_number: payload.from || 'unknown',
          to_number: payload.to || 'unknown',
          status: 'ringing',
          started_at: event.data.occurred_at,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider,provider_call_id' },
      )
      .select('id')
      .single();
    await client.calls.actions.answer(payload.call_control_id, {
      command_id: `${eventId}-answer`,
      client_state: encodeCallState({ systemId: system.id, callId: created?.id || '' }),
      ...(system.call_recording_enabled
        ? {
            record: 'record-from-answer' as const,
            record_format: 'mp3' as const,
            record_channels: 'dual' as const,
          }
        : {}),
    });
    return;
  }
  if (type === 'call.answered') {
    await db
      .from('phone_calls')
      .update({
        status: 'answered',
        answered_at: event.data.occurred_at,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'telnyx')
      .eq('provider_call_id', payload.call_control_id);
    if (!isOpenNow(system.business_hours, system.timezone)) {
      await beginVoicemail(system, payload.call_control_id, eventId);
      return;
    }
    const { data: options } = await db
      .from('phone_menu_options')
      .select('digit,label')
      .eq('phone_system_id', system.id)
      .eq('enabled', true)
      .order('position');
    if (system.routing_mode === 'menu' && options?.length) {
      const menuDigits = Array.from(
        new Set([...options.map((option: any) => String(option.digit)), '9']),
      ).join('');
      await client.calls.actions.gatherUsingSpeak(payload.call_control_id, {
        payload: `${menuPrompt(system.greeting, options)} Press 9 if you know your program holder's three-digit extension.`,
        voice: 'Telnyx.KokoroTTS.af',
        minimum_digits: 1,
        maximum_digits: 1,
        valid_digits: menuDigits,
        maximum_tries: 2,
        timeout_millis: 7000,
        command_id: `${eventId}-menu`,
        client_state: encodeCallState({ systemId: system.id, phase: 'main_menu' }),
      });
    } else if (system.default_destination_id) {
      await transferToDestination(
        db,
        system,
        payload.call_control_id,
        system.default_destination_id,
        eventId,
      );
    } else {
      await beginVoicemail(system, payload.call_control_id, eventId);
    }
    return;
  }
  if (type === 'call.gather.ended') {
    const digits = String(payload.digits ?? '').trim();
    const state = decodeCallState(payload.client_state);
    if (state.phase === 'extension_menu') {
      const { data: workspace } = await db
        .from('communication_workspaces')
        .select('id')
        .eq('phone_system_id', system.id)
        .maybeSingle();
      const { data: extension } = workspace?.id
        ? await db
            .from('communication_extensions')
            .select('destination_id')
            .eq('workspace_id', workspace.id)
            .eq('extension', digits)
            .eq('enabled', true)
            .maybeSingle()
        : { data: null };
      if (extension?.destination_id) {
        await transferToDestination(
          db,
          system,
          payload.call_control_id,
          extension.destination_id,
          eventId,
        );
      } else {
        await client.calls.actions.speak(payload.call_control_id, {
          payload: 'That extension is not available. Please leave a message after the beep.',
          voice: 'Telnyx.KokoroTTS.af',
          command_id: `${eventId}-extension-unavailable`,
          client_state: encodeCallState({
            systemId: system.id,
            phase: 'voicemail_prompt',
          }),
        });
      }
      return;
    }
    if (digits === '9') {
      await client.calls.actions.gatherUsingSpeak(payload.call_control_id, {
        payload: 'Please enter the three-digit program holder extension.',
        voice: 'Telnyx.KokoroTTS.af',
        minimum_digits: 3,
        maximum_digits: 3,
        valid_digits: '0123456789',
        maximum_tries: 2,
        timeout_millis: 9000,
        command_id: `${eventId}-extension-menu`,
        client_state: encodeCallState({ systemId: system.id, phase: 'extension_menu' }),
      });
      return;
    }
    const digit = Number(digits);
    const { data: option } = await db
      .from('phone_menu_options')
      .select('destination_id')
      .eq('phone_system_id', system.id)
      .eq('digit', digit)
      .eq('enabled', true)
      .maybeSingle();
    const destinationId = option?.destination_id || system.default_destination_id;
    if (destinationId)
      await transferToDestination(db, system, payload.call_control_id, destinationId, eventId);
    else await beginVoicemail(system, payload.call_control_id, eventId);
    return;
  }
  if (
    type === 'call.speak.ended' &&
    decodeCallState(payload.client_state).phase === 'voicemail_prompt'
  ) {
    await client.calls.actions.startRecording(payload.call_control_id, {
      channels: 'single',
      format: 'mp3',
      recording_track: 'inbound',
      play_beep: true,
      max_length: 180,
      timeout_secs: 5,
      transcription: system.voicemail_transcription_enabled,
      transcription_engine: 'B',
      transcription_language: 'en-US',
      command_id: `${eventId}-voicemail-record`,
      client_state: encodeCallState({ systemId: system.id, phase: 'voicemail_recording' }),
    });
    return;
  }
  if (type === 'call.hangup') {
    await db
      .from('phone_calls')
      .update({
        status: 'completed',
        ended_at: event.data.occurred_at,
        duration_seconds: payload.duration_millis
          ? Math.round(payload.duration_millis / 1000)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'telnyx')
      .eq('provider_call_id', payload.call_control_id);
  }
  if (
    type === 'call.recording.saved' &&
    (payload.recording_urls?.mp3 || payload.recording_urls?.wav)
  ) {
    const recordingUrl = payload.recording_urls.mp3 || payload.recording_urls.wav;
    await db
      .from('phone_calls')
      .update({
        recording_url: recordingUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('provider', 'telnyx')
      .eq('provider_call_id', payload.call_control_id);
    if (decodeCallState(payload.client_state).phase === 'voicemail_recording' && recordingUrl) {
      await db.from('voicemails').insert({
        phone_system_id: system.id,
        call_id: call?.id ?? null,
        phone_number: call?.from_number || 'unknown',
        recording_url: recordingUrl,
        duration_seconds: payload.duration_millis
          ? Math.round(payload.duration_millis / 1000)
          : null,
        is_read: false,
        status: 'new',
      });
    }
  }
  if (type === 'call.recording.transcription.saved' && payload.transcription_text && call?.id) {
    await db
      .from('voicemails')
      .update({ transcription: payload.transcription_text })
      .eq('call_id', call.id);
  }
}

export async function POST(request: Request) {
  const body = await request.text();
  let event: TelnyxCallEvent;
  try {
    event = await verifyTelnyxWebhook(body, request.headers);
  } catch (error) {
    console.warn('Rejected Telnyx webhook:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }
  const db = await requireAdminClient();
  const context = await findContext(db, event);
  if (!context.system) return NextResponse.json({ received: true, ignored: 'unknown number' });
  const { error: ledgerError } = await db.from('phone_call_events').insert({
    phone_system_id: context.system.id,
    call_id: context.call?.id ?? null,
    provider: 'telnyx',
    provider_event_id: event.data.id,
    event_type: event.data.event_type,
    occurred_at: event.data.occurred_at,
    payload: event.data.payload,
  });
  if (ledgerError?.code === '23505') return NextResponse.json({ received: true, duplicate: true });
  if (ledgerError) return NextResponse.json({ error: 'Unable to persist event.' }, { status: 500 });
  try {
    await handleEvent(db, event, context.system, context.call, context.phoneNumber);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Telnyx event processing failed:', error);
    // The provider retries non-2xx deliveries. Remove the reservation so the
    // retry can process it; Telnyx command_id still prevents duplicate actions
    // if the network failed after Telnyx accepted a command.
    await db
      .from('phone_call_events')
      .delete()
      .eq('provider', 'telnyx')
      .eq('provider_event_id', event.data.id);
    return NextResponse.json({ error: 'Event processing failed.' }, { status: 500 });
  }
}
