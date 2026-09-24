import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { PushNotificationService } from '@/lib/notifications/push-service';
import { sendSMS } from '@/lib/notifications/sms';
import { isExtensionReachable } from '@/lib/phone/availability';
import {
  decodeCallState,
  encodeCallState,
  isOpenNow,
  menuPrompt,
  publicPhoneNumber,
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
  paris_intake_enabled: boolean;
  admin_extension: string;
  ai_instructions: string;
};

type CallState = Record<string, string> & {
  systemId?: string;
  callId?: string;
  parentCallControlId?: string;
  extensionId?: string;
  profileId?: string;
  taskId?: string;
  phase?: string;
};

const push = new PushNotificationService();

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function transcriptFromHistory(value: unknown) {
  if (!Array.isArray(value)) return '';
  return value
    .map((entry: any) => {
      const content = String(entry?.content || '').trim();
      if (!content) return '';
      return `${entry?.role === 'assistant' ? 'PARIS' : 'Caller'}: ${content}`;
    })
    .filter(Boolean)
    .join('\n');
}

function aiResult(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return aiResult(JSON.parse(value));
    } catch {
      return { reason: value };
    }
  }
  if (typeof value !== 'object' || Array.isArray(value)) return {};
  const record = value as Record<string, any>;
  return (record.parameters || record.data || record.result || record) as Record<string, any>;
}

function appUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_LMS_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.elevateforhumanity.org';
  return new URL(path, base).toString();
}

async function notifyAssignee(
  db: any,
  input: {
    profileId?: string;
    taskId: string;
    caller: string;
    urgency: string;
  },
) {
  if (!input.profileId) return;
  const url = appUrl('/program-holder/phone');
  await push.sendToUserWithDatabase(db, input.profileId, {
    title: input.urgency === 'urgent' ? 'Urgent call for your extension' : 'New call to return',
    body: `${input.caller} left details with PARIS. Open your secure phone inbox.`,
    icon: '/icon-192x192.png',
    badge: '/icon-72.png',
    url,
    tag: `phone-callback-${input.taskId}`,
    requireInteraction: input.urgency === 'urgent',
    vibrate: [200, 100, 200],
  });

  const [{ data: profile }, { data: preferences }] = await Promise.all([
    db.from('profiles').select('email,full_name').eq('id', input.profileId).maybeSingle(),
    db
      .from('notification_preferences')
      .select('email_missed_calls,sms_missed_calls,sms_phone')
      .eq('user_id', input.profileId)
      .maybeSingle(),
  ]);
  if (preferences?.sms_missed_calls === true && preferences?.sms_phone) {
    const smsResult = await sendSMS(
      preferences.sms_phone,
      `${input.urgency === 'urgent' ? 'URGENT: ' : ''}${input.caller} left details with PARIS. Open your secure Elevate Phone inbox: ${url}`,
    );
    if (!smsResult.success) console.error('Missed-call SMS delivery failed:', smsResult.error);
  }
  if (!profile?.email || preferences?.email_missed_calls === false) return;
  try {
    await resend.emails.send({
      from: 'Elevate Phone <noreply@elevateforhumanity.org>',
      to: profile.email,
      subject:
        input.urgency === 'urgent'
          ? 'Urgent call requires follow-up'
          : 'New call in your Elevate Phone inbox',
      text: `${input.caller} left details with PARIS. Sign in to your secure phone inbox: ${url}`,
      html: `<p><strong>${escapeHtml(input.caller)}</strong> left details with PARIS.</p><p><a href="${escapeHtml(url)}">Open your secure phone inbox</a> to review the summary and return the call.</p><p>For privacy, caller details and recordings are not included in this email.</p>`,
    });
  } catch (error) {
    console.error('Missed-call email delivery failed:', error);
  }
}

async function findContext(db: any, event: TelnyxCallEvent) {
  const payload = event.data.payload;
  const state = decodeCallState(payload.client_state) as CallState;
  if (state.systemId) {
    const [{ data: system }, { data: call }] = await Promise.all([
      db.from('phone_systems').select('*').eq('id', state.systemId).maybeSingle(),
      state.callId
        ? db.from('phone_calls').select('*').eq('id', state.callId).maybeSingle()
        : db
            .from('phone_calls')
            .select('*')
            .eq('provider', 'telnyx')
            .eq('provider_call_id', payload.call_control_id)
            .maybeSingle(),
    ]);
    return { system: system as System | null, call, phoneNumber: null, state };
  }
  const { data: phoneNumber } = await db
    .from('phone_numbers')
    .select('id,phone_system_id')
    .eq('e164', payload.to)
    .eq('provider', 'telnyx')
    .eq('status', 'active')
    .maybeSingle();
  if (!phoneNumber) return { system: null, call: null, phoneNumber: null, state };
  const [{ data: system }, { data: call }] = await Promise.all([
    db.from('phone_systems').select('*').eq('id', phoneNumber.phone_system_id).maybeSingle(),
    db
      .from('phone_calls')
      .select('*')
      .eq('provider', 'telnyx')
      .eq('provider_call_id', payload.call_control_id)
      .maybeSingle(),
  ]);
  return { system: system as System | null, call, phoneNumber, state };
}

async function defaultAdminRoute(db: any, system: System) {
  const { data: workspace } = await db
    .from('communication_workspaces')
    .select('id')
    .eq('phone_system_id', system.id)
    .maybeSingle();
  if (!workspace) return {};
  const { data: extension } = await db
    .from('communication_extensions')
    .select('id,profile_id')
    .eq('workspace_id', workspace.id)
    .eq('extension', system.admin_extension || '100')
    .eq('enabled', true)
    .maybeSingle();
  return extension
    ? { extensionId: extension.id as string, profileId: extension.profile_id as string | undefined }
    : {};
}

async function unavailableGreeting(
  db: any,
  route: { extensionId?: string; profileId?: string },
  fallback: string,
) {
  if (!route.extensionId) return fallback;
  const { data: extension } = await db
    .from('communication_extensions')
    .select('voicemail_greeting')
    .eq('id', route.extensionId)
    .maybeSingle();
  return (
    String(extension?.voicemail_greeting || '')
      .trim()
      .slice(0, 600) || fallback
  );
}

async function startVoicemail(
  db: any,
  system: System,
  call: any,
  callControlId: string,
  eventId: string,
  route: { extensionId?: string; profileId?: string } = {},
) {
  if (!route.extensionId) route = await defaultAdminRoute(db, system);
  const greeting = await unavailableGreeting(db, route, system.after_hours_message);
  if (!system.voicemail_enabled) {
    await telnyxClient().calls.actions.speak(callControlId, {
      payload: `${greeting} Please try again later.`,
      voice: 'Telnyx.KokoroTTS.af',
      command_id: `${eventId}-unavailable`,
      client_state: encodeCallState({
        systemId: system.id,
        callId: call?.id || '',
        phase: 'unavailable_end',
      }),
    });
    return;
  }
  const { data: existingTask } = call?.id
    ? await db
        .from('phone_callback_tasks')
        .select('id')
        .eq('call_id', call.id)
        .eq('source', 'voicemail')
        .order('created_at')
        .limit(1)
        .maybeSingle()
    : { data: null };
  const { data: task, error: taskError } = existingTask
    ? { data: existingTask, error: null }
    : await db
        .from('phone_callback_tasks')
        .insert({
          call_id: call?.id ?? null,
          extension_id: route.extensionId || null,
          assigned_profile_id: route.profileId || null,
          source: 'voicemail',
          callback_number: call?.from_number || null,
          status: 'new',
        })
        .select('id')
        .single();
  if (taskError || !task?.id) throw new Error('Unable to create the voicemail callback task.');
  await telnyxClient().calls.actions.speak(callControlId, {
    payload: `${greeting} Your message will be recorded and transcribed. Please leave your name, callback number, and message after the beep.`,
    voice: 'Telnyx.KokoroTTS.af',
    command_id: `${eventId}-voicemail-prompt`,
    client_state: encodeCallState({
      systemId: system.id,
      callId: call?.id || '',
      taskId: task?.id || '',
      extensionId: route.extensionId || '',
      profileId: route.profileId || '',
      phase: 'voicemail_prompt',
    }),
  });
}

async function startParis(
  db: any,
  system: System,
  call: any,
  callControlId: string,
  eventId: string,
  route: { extensionId?: string; profileId?: string } = {},
) {
  if (!route.extensionId) route = await defaultAdminRoute(db, system);
  if (!system.paris_intake_enabled) {
    return startVoicemail(db, system, call, callControlId, eventId, route);
  }
  const { data: existing } = call?.id
    ? await db
        .from('phone_callback_tasks')
        .select('id')
        .eq('call_id', call.id)
        .eq('source', 'paris')
        .order('created_at')
        .limit(1)
        .maybeSingle()
    : { data: null };
  const { data: created, error: taskError } = existing
    ? { data: existing, error: null }
    : await db
        .from('phone_callback_tasks')
        .insert({
          call_id: call?.id ?? null,
          extension_id: route.extensionId || null,
          assigned_profile_id: route.profileId || null,
          source: 'paris',
          callback_number: call?.from_number || null,
          status: 'new',
        })
        .select('id')
        .single();
  if (taskError || !created?.id) throw new Error('Unable to create the PARIS callback task.');
  const taskId = created?.id || '';
  const greeting = await unavailableGreeting(db, route, 'The person you selected is unavailable.');
  const state = {
    systemId: system.id,
    callId: call?.id || '',
    parentCallControlId: callControlId,
    taskId,
    extensionId: route.extensionId || '',
    profileId: route.profileId || '',
    phase: 'paris_intake',
  };
  try {
    if (taskId) {
      await telnyxClient().calls.actions.startRecording(callControlId, {
        channels: 'single',
        format: 'mp3',
        recording_track: 'inbound',
        play_beep: false,
        max_length: 300,
        timeout_secs: 8,
        command_id: `${eventId}-paris-record`,
        client_state: encodeCallState(state),
      });
    }
    await telnyxClient().calls.actions.gatherUsingAI(callControlId, {
      parameters: {
        type: 'object',
        properties: {
          caller_name: { type: 'string', description: 'Caller full name' },
          callback_number: {
            type: 'string',
            description: 'Best telephone number for the callback',
          },
          reason: { type: 'string', description: 'Clear reason for the call and requested help' },
          program_or_department: { type: 'string', description: 'Program or department involved' },
          urgency: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'] },
          preferred_callback_time: {
            type: 'string',
            description: 'Preferred day and time for a callback',
          },
          immediate_assistance: {
            type: 'boolean',
            description: 'Whether the caller says help is immediately needed',
          },
          caller_type: { type: 'string', description: 'Prospective student, current learner/apprentice, employer, Host Shop, Program Holder, parent/family, workforce partner, or other' },
          program_interest: { type: 'string', description: 'Program or career-training area the caller is interested in' },
          program_questions: { type: 'string', description: 'Questions the caller has about the program' },
          funding_preference: { type: 'string', enum: ['funded','self_pay','unsure'], description: 'Whether the caller is seeking workforce-funded training, self-pay training, or is unsure' },
          workone_contacted: { type: 'boolean', description: 'Whether the caller has contacted or visited WorkOne' },
          workone_orientation_status: { type: 'string', enum: ['scheduled','attended','not_scheduled','unsure'], description: 'Status of the caller WorkOne orientation appointment' },
        },
        required: ['caller_name', 'callback_number', 'reason', 'urgency', 'program_interest', 'funding_preference', 'workone_contacted', 'workone_orientation_status'],
      },
      assistant: {
        instructions: `${system.ai_instructions} You are PARIS, the Elevate for Humanity telephone attendant. Be warm and concise. Tell callers to call 911 for an emergency. Use Elevate's current public website/program information as the authority for general program descriptions and published next steps. Conduct a real, short two-way interview rather than merely collecting fields. After each caller answer, acknowledge what they said and respond to any question they asked before moving to the next relevant question. Explicitly ask, "What questions do you have about the program?" and answer those questions when the answer is supported by Elevate's published information. If they have no questions, continue naturally. Ask what program the caller is interested in and whether they have questions about it. Ask whether they are looking for workforce-funded training, self-pay training, or are unsure. Ask whether they have contacted or visited WorkOne and whether their WorkOne orientation appointment is scheduled, already attended, not yet scheduled, or they are unsure. If they have not scheduled the WorkOne orientation, direct them to the WorkOne orientation scheduling option published from the Elevate website/homepage. Explain published program and funding information accurately, but never promise funding or eligibility: WorkOne/workforce agencies make funding determinations. Do not invent dates, prices, funded-program status, eligibility, approvals, or application status. If current published information does not establish an answer, say so and route the question to an administrator. Never request a Social Security number, payment card, password, medical details, or other highly sensitive data. When uncertain, say the assigned person will return the call. Collect every required field conversationally and read the callback number back for confirmation. Do not repeat extension instructions during the PARIS interview. The caller has already heard the directory/routing instructions before reaching PARIS. Do not tell them again to enter an extension unless they specifically ask how to reach someone.`,
      },
      greeting: `Welcome to Elevate for Humanity. We are a career and technical training organization helping people connect with career training, registered apprenticeships, credentials, employers, and workforce resources. Some training may be available at no cost to eligible participants through workforce funding, while other programs are self-pay. Funding is never guaranteed and is determined by the appropriate workforce agency. I am PARIS, your automated career and admissions assistant. This call may be recorded and transcribed. I can answer questions about our programs and published next steps, help you understand the WorkOne process, or collect information for the right Elevate team member. If this is an emergency, hang up and call 911. To begin, may I have your name, and what can I help you with today?`,
      gather_ended_speech:
        'Thank you. I saved your message securely and someone will get back to you as soon as possible.',
      language: 'en',
      voice: 'Telnyx.KokoroTTS.af',
      send_message_history_updates: true,
      send_partial_results: false,
      user_response_timeout_ms: 20000,
      command_id: `${eventId}-paris-intake`,
      client_state: encodeCallState(state),
    });
  } catch (error) {
    console.error('PARIS gather unavailable; falling back to voicemail:', error);
    await startVoicemail(db, system, call, callControlId, `${eventId}-fallback`, route);
  }
}

async function routeToExtension(
  db: any,
  system: System,
  call: any,
  callControlId: string,
  extensionId: string,
  eventId: string,
) {
  const { data: extension } = await db
    .from('communication_extensions')
    .select('*')
    .eq('id', extensionId)
    .eq('enabled', true)
    .maybeSingle();
  if (!extension) return startParis(db, system, call, callControlId, eventId);
  const route = { extensionId: extension.id, profileId: extension.profile_id || undefined };
  const { data: device } = await db
    .from('phone_webrtc_devices')
    .select('sip_username,last_seen_at')
    .eq('extension_id', extension.id)
    .eq('status', 'active')
    .gte('last_seen_at', new Date(Date.now() - 120_000).toISOString())
    .order('last_seen_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const state = {
    systemId: system.id,
    callId: call?.id || '',
    parentCallControlId: callControlId,
    extensionId: extension.id,
    profileId: extension.profile_id || '',
    phase: 'webrtc_leg',
  };
  if (!device || !isExtensionReachable(extension, system.timezone)) {
    const usedFallback = await dialAdminFallback(db, system, call, state, eventId);
    if (usedFallback) return;
    return startParis(db, system, call, callControlId, eventId, route);
  }
  const connectionId = process.env.TELNYX_CONNECTION_ID;
  if (!connectionId) throw new Error('TELNYX_CONNECTION_ID is not configured.');
  const response = await telnyxClient().calls.dial({
    connection_id: connectionId,
    from: publicPhoneNumber(),
    to: `sip:${device.sip_username}@sip.telnyx.com;secure=srtp`,
    link_to: callControlId,
    bridge_intent: true,
    bridge_on_answer: true,
    timeout_secs: extension.ring_seconds || 20,
    answering_machine_detection: 'disabled',
    retry_on_timeout: false,
    command_id: `${eventId}-webrtc-${extension.id}`,
    client_state: encodeCallState(state),
  });
  const providerCallId = response.data?.call_control_id;
  if (!providerCallId) throw new Error('Telnyx did not return a WebRTC call leg.');
  await Promise.all([
    db.from('phone_call_legs').upsert(
      {
        call_id: call.id,
        provider_call_id: providerCallId,
        extension_id: extension.id,
        profile_id: extension.profile_id,
        leg_type: 'webrtc',
        status: 'initiated',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'provider_call_id' },
    ),
    db
      .from('phone_calls')
      .update({
        assigned_extension_id: extension.id,
        assigned_profile_id: extension.profile_id,
        status: 'routing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', call.id),
    db
      .from('communication_extensions')
      .update({ presence_status: 'busy', updated_at: new Date().toISOString() })
      .eq('id', extension.id),
  ]);
}

async function routeDestination(
  db: any,
  system: System,
  call: any,
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
  if (destination?.extension_id) {
    await db.from('phone_calls').update({ destination_id: destination.id }).eq('id', call.id);
    return routeToExtension(db, system, call, callControlId, destination.extension_id, eventId);
  }
  if (destination?.destination_type === 'voicemail') {
    return startVoicemail(db, system, call, callControlId, eventId);
  }
  return startParis(db, system, call, callControlId, eventId);
}

async function routeAdmin(
  db: any,
  system: System,
  call: any,
  callControlId: string,
  eventId: string,
) {
  const { data: workspace } = await db
    .from('communication_workspaces')
    .select('id')
    .eq('phone_system_id', system.id)
    .maybeSingle();
  const { data: extension } = workspace
    ? await db
        .from('communication_extensions')
        .select('id')
        .eq('workspace_id', workspace.id)
        .eq('extension', system.admin_extension || '100')
        .eq('enabled', true)
        .maybeSingle()
    : { data: null };
  if (extension?.id)
    return routeToExtension(db, system, call, callControlId, extension.id, eventId);
  return startParis(db, system, call, callControlId, eventId);
}

async function dialAdminFallback(
  db: any,
  system: System,
  call: any,
  state: CallState,
  eventId: string,
) {
  const { data: extension } = await db
    .from('communication_extensions')
    .select('*')
    .eq('id', state.extensionId)
    .eq('admin_external_fallback', true)
    .maybeSingle();
  if (!extension?.external_fallback_number || !state.parentCallControlId) return false;
  const connectionId = process.env.TELNYX_CONNECTION_ID;
  if (!connectionId) throw new Error('TELNYX_CONNECTION_ID is not configured.');
  const fallbackState = { ...state, phase: 'admin_fallback' };
  const response = await telnyxClient().calls.dial({
    connection_id: connectionId,
    from: publicPhoneNumber(),
    to: extension.external_fallback_number,
    link_to: state.parentCallControlId,
    bridge_intent: true,
    bridge_on_answer: true,
    timeout_secs: 20,
    answering_machine_detection: 'disabled',
    retry_on_timeout: false,
    command_id: `${eventId}-admin-fallback`,
    client_state: encodeCallState(fallbackState),
  });
  if (!response.data?.call_control_id) return false;
  await db.from('phone_call_legs').upsert(
    {
      call_id: call.id,
      provider_call_id: response.data.call_control_id,
      extension_id: extension.id,
      profile_id: extension.profile_id,
      leg_type: 'admin_fallback',
      status: 'initiated',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'provider_call_id' },
  );
  return true;
}

async function handleEvent(
  db: any,
  event: TelnyxCallEvent,
  system: System,
  call: any,
  phoneNumber: any,
  state: CallState,
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
      client_state: encodeCallState({
        systemId: system.id,
        callId: created?.id || '',
        parentCallControlId: payload.call_control_id,
        phase: 'inbound',
      }),
    });
    return;
  }

  if (state.phase === 'webrtc_leg' || state.phase === 'admin_fallback') {
    if (type === 'call.initiated') {
      await db.from('phone_call_legs').upsert(
        {
          call_id: call.id,
          provider_call_id: payload.call_control_id,
          extension_id: state.extensionId || null,
          profile_id: state.profileId || null,
          leg_type: state.phase === 'admin_fallback' ? 'admin_fallback' : 'webrtc',
          status: 'ringing',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider_call_id' },
      );
      return;
    }
    if (type === 'call.answered') {
      await Promise.all([
        db
          .from('phone_call_legs')
          .update({
            status: 'answered',
            answered_at: event.data.occurred_at,
            updated_at: new Date().toISOString(),
          })
          .eq('provider_call_id', payload.call_control_id),
        db
          .from('phone_calls')
          .update({
            status: 'answered',
            answered_at: event.data.occurred_at,
            updated_at: new Date().toISOString(),
          })
          .eq('id', call.id),
      ]);
      return;
    }
    if (type === 'call.hangup') {
      const { data: leg } = await db
        .from('phone_call_legs')
        .select('answered_at')
        .eq('provider_call_id', payload.call_control_id)
        .maybeSingle();
      await db
        .from('phone_call_legs')
        .update({
          status: 'completed',
          ended_at: event.data.occurred_at,
          hangup_cause: payload.hangup_cause || null,
          updated_at: new Date().toISOString(),
        })
        .eq('provider_call_id', payload.call_control_id);
      if (state.extensionId) {
        await db
          .from('communication_extensions')
          .update({ presence_status: 'available', updated_at: new Date().toISOString() })
          .eq('id', state.extensionId)
          .neq('ring_mode', 'offline')
          .neq('ring_mode', 'do_not_disturb');
      }
      if (!leg?.answered_at && state.parentCallControlId) {
        if (state.phase === 'webrtc_leg') {
          const usedFallback = await dialAdminFallback(db, system, call, state, eventId);
          if (usedFallback) return;
        }
        await startParis(db, system, call, state.parentCallControlId, eventId, {
          extensionId: state.extensionId,
          profileId: state.profileId,
        });
      }
      return;
    }
  }

  if (type === 'call.answered') {
    await db
      .from('phone_calls')
      .update({
        status: 'answered',
        answered_at: event.data.occurred_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', call.id);
    if (!isOpenNow(system.business_hours, system.timezone)) {
      await startParis(db, system, call, payload.call_control_id, eventId);
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
        new Set([...options.map((option: any) => String(option.digit)), '9', '0']),
      ).join('');
      await client.calls.actions.gatherUsingSpeak(payload.call_control_id, {
        payload: `${menuPrompt(system.greeting, options)} Press 0 for immediate assistance or for questions not covered by the directory.`,
        voice: 'Telnyx.KokoroTTS.af',
        minimum_digits: 1,
        maximum_digits: 1,
        valid_digits: menuDigits,
        maximum_tries: 2,
        timeout_millis: 7000,
        command_id: `${eventId}-menu`,
        client_state: encodeCallState({
          systemId: system.id,
          callId: call.id,
          parentCallControlId: payload.call_control_id,
          phase: 'main_menu',
        }),
      });
    } else if (system.default_destination_id) {
      await routeDestination(
        db,
        system,
        call,
        payload.call_control_id,
        system.default_destination_id,
        eventId,
      );
    } else {
      await startParis(db, system, call, payload.call_control_id, eventId);
    }
    return;
  }

  if (type === 'call.gather.ended') {
    const digits = String(payload.digits ?? '').trim();
    if (state.phase === 'extension_menu') {
      const { data: workspace } = await db
        .from('communication_workspaces')
        .select('id')
        .eq('phone_system_id', system.id)
        .maybeSingle();
      const { data: extension } = workspace?.id
        ? await db
            .from('communication_extensions')
            .select('id')
            .eq('workspace_id', workspace.id)
            .eq('extension', digits)
            .eq('enabled', true)
            .maybeSingle()
        : { data: null };
      if (extension?.id) {
        await routeToExtension(db, system, call, payload.call_control_id, extension.id, eventId);
      } else {
        await startParis(db, system, call, payload.call_control_id, eventId);
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
        client_state: encodeCallState({
          systemId: system.id,
          callId: call.id,
          parentCallControlId: payload.call_control_id,
          phase: 'extension_menu',
        }),
      });
      return;
    }
    if (digits === '0') {
      await routeAdmin(db, system, call, payload.call_control_id, eventId);
      return;
    }
    const { data: option } = await db
      .from('phone_menu_options')
      .select('destination_id')
      .eq('phone_system_id', system.id)
      .eq('digit', Number(digits))
      .eq('enabled', true)
      .maybeSingle();
    const destinationId = option?.destination_id || system.default_destination_id;
    if (destinationId) {
      await routeDestination(db, system, call, payload.call_control_id, destinationId, eventId);
    } else {
      await startParis(db, system, call, payload.call_control_id, eventId);
    }
    return;
  }

  if (type === 'call.ai_gather.message_history_updated' && state.taskId) {
    const transcript = transcriptFromHistory(payload.message_history);
    if (transcript) {
      await db
        .from('phone_callback_tasks')
        .update({ transcript, updated_at: new Date().toISOString() })
        .eq('id', state.taskId);
    }
    return;
  }

  if (type === 'call.ai_gather.ended' && state.taskId) {
    const result = aiResult(payload.result);
    const urgency = ['low', 'normal', 'high', 'urgent'].includes(String(result.urgency))
      ? String(result.urgency)
      : 'normal';
    const callerName =
      String(result.caller_name || '')
        .trim()
        .slice(0, 200) || null;
    const callbackNumber =
      String(result.callback_number || call?.from_number || '')
        .trim()
        .slice(0, 40) || null;
    const reason =
      String(result.reason || '')
        .trim()
        .slice(0, 4000) || null;
    const intakeContext = [
      result.caller_type ? `Caller type: ${String(result.caller_type)}` : '',
      result.program_interest ? `Program: ${String(result.program_interest)}` : '',
      result.funding_preference ? `Funding: ${String(result.funding_preference)}` : '',
      typeof result.workone_contacted === 'boolean' ? `WorkOne contacted: ${result.workone_contacted ? 'yes' : 'no'}` : '',
      result.workone_orientation_status ? `WorkOne orientation: ${String(result.workone_orientation_status)}` : '',
      result.program_questions ? `Program questions: ${String(result.program_questions)}` : '',
    ].filter(Boolean).join(' · ');
    const summary = [callerName || 'Caller', reason || 'requested assistance', intakeContext]
      .filter(Boolean)
      .join(': ')
      .slice(0, 1000);
    await db
      .from('phone_callback_tasks')
      .update({
        caller_name: callerName,
        callback_number: callbackNumber,
        reason,
        program_or_department:
          String(result.program_interest || result.program_or_department || '')
            .trim()
            .slice(0, 300) || null,
        urgency,
        preferred_callback_time:
          String(result.preferred_callback_time || '')
            .trim()
            .slice(0, 300) || null,
        structured_answers: result,
        summary,
        status: 'new',
        updated_at: new Date().toISOString(),
      })
      .eq('id', state.taskId);
    await notifyAssignee(db, {
      profileId: state.profileId,
      taskId: state.taskId,
      caller: callerName || callbackNumber || 'A caller',
      urgency,
    });
    try {
      await client.calls.actions.hangup(payload.call_control_id, {
        command_id: `${eventId}-paris-complete-hangup`,
      });
    } catch {
      // The caller may hang up after the closing message.
    }
    return;
  }

  if (type === 'call.speak.ended' && state.phase === 'voicemail_prompt') {
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
      client_state: encodeCallState({ ...state, phase: 'voicemail_recording' }),
    });
    return;
  }

  if (type === 'call.speak.ended' && state.phase === 'unavailable_end') {
    await client.calls.actions.hangup(payload.call_control_id, {
      command_id: `${eventId}-unavailable-hangup`,
    });
    return;
  }

  if (
    type === 'call.recording.saved' &&
    (payload.recording_urls?.mp3 || payload.recording_urls?.wav)
  ) {
    const recordingUrl = payload.recording_urls.mp3 || payload.recording_urls.wav;
    if (state.taskId && recordingUrl) {
      await db
        .from('phone_callback_tasks')
        .update({ recording_url: recordingUrl, updated_at: new Date().toISOString() })
        .eq('id', state.taskId);
    }
    await db
      .from('phone_calls')
      .update({ recording_url: recordingUrl, updated_at: new Date().toISOString() })
      .eq('id', call.id);
    if (state.phase === 'voicemail_recording' && recordingUrl) {
      await db.from('voicemails').insert({
        phone_system_id: system.id,
        call_id: call?.id ?? null,
        extension_id: state.extensionId || null,
        assigned_profile_id: state.profileId || null,
        phone_number: call?.from_number || 'unknown',
        recording_url: recordingUrl,
        duration_seconds: payload.duration_millis
          ? Math.round(payload.duration_millis / 1000)
          : null,
        is_read: false,
        status: 'new',
      });
      await notifyAssignee(db, {
        profileId: state.profileId,
        taskId: state.taskId,
        caller: call?.from_number || 'A caller',
        urgency: 'normal',
      });
    }
    return;
  }

  if (type === 'call.recording.transcription.saved' && payload.transcription_text) {
    if (state.taskId) {
      await db
        .from('phone_callback_tasks')
        .update({
          transcript: payload.transcription_text,
          summary: payload.transcription_text.slice(0, 1000),
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.taskId);
    }
    await db
      .from('voicemails')
      .update({
        transcription: payload.transcription_text,
        summary: payload.transcription_text.slice(0, 1000),
      })
      .eq('call_id', call.id);
    return;
  }

  if (type === 'call.hangup') {
    if (state.taskId && state.profileId) {
      const { data: unfinished } = await db
        .from('phone_callback_tasks')
        .select('summary,callback_number')
        .eq('id', state.taskId)
        .maybeSingle();
      if (unfinished && !unfinished.summary) {
        await db
          .from('phone_callback_tasks')
          .update({
            summary: 'Caller disconnected before PARIS finished the interview.',
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.taskId);
        await notifyAssignee(db, {
          profileId: state.profileId,
          taskId: state.taskId,
          caller: unfinished.callback_number || call?.from_number || 'A caller',
          urgency: 'normal',
        });
      }
    }
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
      .eq('id', call.id);
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
    await handleEvent(db, event, context.system, context.call, context.phoneNumber, context.state);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Telnyx event processing failed:', error);
    await db
      .from('phone_call_events')
      .delete()
      .eq('provider', 'telnyx')
      .eq('provider_event_id', event.data.id);
    return NextResponse.json({ error: 'Event processing failed.' }, { status: 500 });
  }
}
