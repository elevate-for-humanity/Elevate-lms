'use server';
import { assertGoogleCalendarAvailable } from '@/lib/calendar/google-calendar';

import { revalidatePath } from 'next/cache';
import { requireRole, type AuthResult } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { businessHoursFromForm, normalizeUsPhone, validMenuDigit, validPhoneExtension } from '@/lib/phone/config';
import { ensureLiveKitRoom, liveKitReadiness } from '@/lib/communications/livekit';
import { scopePhoneProfileQuery } from '@/lib/phone/profile-scope';
import { findPhoneWorkspace } from '@/lib/phone/workspace';
import {
  normalizeVoicemailGreetingMode,
  validateVoicemailGreetingText,
} from '@/lib/phone/voicemail-greeting';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import {hydrateProcessEnv} from '@/lib/secrets';

export type PhoneActionState = { ok: boolean; message: string };

function tenantIdFor(auth: AuthResult): string | null {
  return auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
}

function scopeSystemQuery(query: any, tenantId: string | null) {
  return tenantId ? query.eq('tenant_id', tenantId) : query.is('tenant_id', null);
}

async function requirePhoneContext() {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const db = await requireAdminClient();
  const tenantId = tenantIdFor(auth);
  const platformAdmin = auth.effectiveRoles.some(
    (role) => role === 'admin' || role === 'super_admin',
  );
  if (!tenantId && !platformAdmin)
    throw new Error('Your account is not attached to an organization.');
  return { db, tenantId, platformAdmin };
}

async function requireSystemId() {
  const { db, tenantId, platformAdmin } = await requirePhoneContext();
  const { data: tenantSystem, error } = await scopeSystemQuery(
    db.from('phone_systems').select('id').limit(1),
    tenantId,
  ).maybeSingle();
  if (error) throw new Error(`Unable to load phone system: ${error.message}`);
  if (tenantSystem?.id) return { db, id: tenantSystem.id as string };
  if (platformAdmin && tenantId) {
    const { data: platformSystem, error: platformError } = await db
      .from('phone_systems')
      .select('id')
      .is('tenant_id', null)
      .limit(1)
      .maybeSingle();
    if (platformError)
      throw new Error(`Unable to load platform phone system: ${platformError.message}`);
    if (platformSystem?.id) return { db, id: platformSystem.id as string };
  }
  const { data, error: insertError } = await db
    .from('phone_systems')
    .insert({ name: 'Elevate Communications', tenant_id: tenantId })
    .select('id')
    .single();
  if (insertError) throw new Error(`Unable to create phone system: ${insertError.message}`);
  return { db, id: data.id as string };
}

async function requireWorkspace() {
  const { db, tenantId, platformAdmin } = await requirePhoneContext();
  const { id: phoneSystemId } = await requireSystemId();
  const existingWorkspace = await findPhoneWorkspace(db, tenantId, platformAdmin, phoneSystemId);
  if (existingWorkspace) return { db, workspace: existingWorkspace };
  const readiness = liveKitReadiness();
  const { data, error: createError } = await db
    .from('communication_workspaces')
    .insert({
      tenant_id: tenantId,
      phone_system_id: phoneSystemId,
      name: 'Elevate Communications',
      status: readiness.ready ? 'active' : 'setup',
    })
    .select('*')
    .single();
  if (createError) throw new Error(createError.message);
  return { db, workspace: data };
}

export async function createMeeting(formData: FormData): Promise<void> {
  await hydrateProcessEnv();
  const scheduledInput=String(formData.get('scheduledAt')||'');
  const scheduledAt=scheduledInput?new Date(scheduledInput):null;
  if(scheduledAt && (!Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime()<Date.now()-60000))throw new Error('Choose a future meeting date and time.');
  const title = String(formData.get('title') ?? '').trim();
  const roomType = String(formData.get('roomType') ?? 'meeting');
  if (title.length < 3 || title.length > 120)
    throw new Error('Meeting title must be 3–120 characters.');
  if (!['meeting', 'team_huddle', 'webinar', 'support', 'classroom'].includes(roomType)) {
    throw new Error('Choose a valid meeting type.');
  }
  const readiness = liveKitReadiness();
  if ('missing' in readiness)
    throw new Error(`Meeting service is not configured: ${readiness.missing.join(', ')}`);
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const { db, workspace } = await requireWorkspace();
  const meetingStart = scheduledAt || new Date();
  await assertGoogleCalendarAvailable(auth.profile.id, meetingStart.toISOString(), new Date(meetingStart.getTime() + 60 * 60000).toISOString());
  const roomKey = `elevate-${workspace.id}-${crypto.randomUUID()}`;
  await ensureLiveKitRoom(roomKey, 50);
  const { error } = await db.from('communication_rooms').insert({
    workspace_id: workspace.id,
    room_key: roomKey,
    title,
    room_type: roomType,
    host_profile_id: auth.profile.id,
    status: 'open',
    scheduled_at: scheduledAt?.toISOString() || null,
    started_at: scheduledAt ? null : new Date().toISOString(),
    max_participants: 50,
    allow_screen_share: true,
    allow_chat: true,
  });
  if (error) throw new Error(error.message);
  if (workspace.status !== 'active') {
    await db
      .from('communication_workspaces')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', workspace.id);
  }
  revalidatePath('/phone/meetings');
}

export async function dismissCommunicationsAnnouncement(): Promise<void> {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const { db, workspace } = await requireWorkspace();
  const { error } = await db.from('communication_onboarding_progress').upsert(
    {
      workspace_id: workspace.id,
      user_id: auth.profile.id,
      announcement_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id,user_id' },
  );
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
}

const checked = (formData: FormData, name: string) => formData.get(name) === 'on';
function boundedInteger(value: FormDataEntryValue | null, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : null;
}
function failure(error: unknown, fallback: string): PhoneActionState {
  return { ok: false, message: error instanceof Error ? error.message : fallback };
}

export async function savePhoneSettings(
  _state: PhoneActionState,
  formData: FormData,
): Promise<PhoneActionState> {
  try {
    const { db, id } = await requireSystemId();
    const greeting = String(formData.get('greeting') ?? '').trim();
    const afterHours = String(formData.get('afterHours') ?? '').trim();
    const routingMode = String(formData.get('routingMode') ?? 'menu');
    const maxQueueSeconds = boundedInteger(formData.get('maxQueueSeconds'), 15, 600);
    if (!greeting || !afterHours) return { ok: false, message: 'Enter both greeting messages.' };
    if (!['menu', 'ai_receptionist'].includes(routingMode)) {
      return { ok: false, message: 'Choose a valid call-routing mode.' };
    }
    if (!maxQueueSeconds)
      return { ok: false, message: 'Queue time must be between 15 and 600 seconds.' };

    const aiEnabled = checked(formData, 'aiEnabled');
    const aiInstructions = String(formData.get('aiInstructions') ?? '').trim();
    if (aiEnabled && aiInstructions.length < 20) {
      return { ok: false, message: 'Give the AI receptionist clear operating instructions.' };
    }
    // Asterisk currently records unanswered-call voicemail regardless of this
    // database setting. The ingest API rejects recordings when disabled, which
    // would discard callers' messages. Do not permit that unsafe mismatch until
    // Admin settings are applied and acknowledged by the PBX itself.
    if (!checked(formData, 'voicemailEnabled')) {
      return { ok: false, message: 'Voicemail cannot be disabled from Admin until the live PBX confirms the change. No settings were saved.' };
    }
    const recordingEnabled = checked(formData, 'callRecordingEnabled');
    const recordingDisclosure = String(formData.get('recordingDisclosure') ?? '').trim();
    if (recordingEnabled && !recordingDisclosure) {
      return {
        ok: false,
        message: 'A recording disclosure is required when recording is enabled.',
      };
    }

    const { error } = await db
      .from('phone_systems')
      .update({
        greeting,
        after_hours_message: afterHours,
        routing_mode: routingMode,
        timezone: String(formData.get('timezone') ?? 'America/Indiana/Indianapolis'),
        business_hours: businessHoursFromForm(formData),
        max_queue_seconds: maxQueueSeconds,
        voicemail_enabled: checked(formData, 'voicemailEnabled'),
        voicemail_transcription_enabled: checked(formData, 'voicemailTranscriptionEnabled'),
        call_recording_enabled: recordingEnabled,
        recording_disclosure: recordingEnabled ? recordingDisclosure : null,
        ai_enabled: aiEnabled,
        ai_name: String(formData.get('aiName') ?? '').trim() || 'Elevate Assistant',
        ai_voice: String(formData.get('aiVoice') ?? 'natural'),
        ai_language: String(formData.get('aiLanguage') ?? 'en-US'),
        ai_instructions: aiInstructions,
        ai_allow_interruptions: checked(formData, 'aiAllowInterruptions'),
        ai_human_handoff_enabled: checked(formData, 'aiHumanHandoffEnabled'),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return { ok: false, message: error.message };
    revalidatePath('/phone');
    return { ok: true, message: 'Phone preferences saved to the database only; live PBX greetings, hours, routing and voicemail have NOT been applied or verified. Existing live phone configuration remains unchanged.' };
  } catch (error) {
    return failure(error, 'Unable to save phone settings.');
  }
}

export async function saveSmsAutoReplySettings(
  _state: PhoneActionState,
  formData: FormData,
): Promise<PhoneActionState> {
  try {
    const { db, id } = await requireSystemId();
    const enabled = checked(formData, 'smsAutoReplyEnabled');
    const message = String(formData.get('smsAutoReplyMessage') ?? '').trim();
    if (message.length > 480)
      return { ok: false, message: 'Keep the auto-reply under 480 characters.' };
    if (enabled && message.length < 10)
      return {
        ok: false,
        message: 'Write the auto-reply message people will receive, or turn the auto-reply off.',
      };
    const { error } = await db
      .from('phone_systems')
      .update({
        sms_auto_reply_enabled: enabled,
        sms_auto_reply_message: message || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) {
      // Until the sms_auto_reply_settings migration is applied the columns
      // do not exist; say so plainly instead of surfacing a schema error.
      if (/sms_auto_reply|column|schema cache/i.test(error.message))
        return {
          ok: false,
          message:
            'Text auto-reply cannot be saved yet — the database update for this feature has not been applied. Nothing else was changed.',
        };
      return { ok: false, message: error.message };
    }
    revalidatePath('/phone');
    return {
      ok: true,
      message: enabled
        ? 'Text auto-reply is on. Someone who texts your business number gets this reply right away — at most once per person per day.'
        : 'Text auto-reply is off.',
    };
  } catch (error) {
    return failure(error, 'Unable to save text auto-reply settings.');
  }
}


type VoicemailGreetingForm = { mode: 'text' | 'recording'; text: string; recordingPath: string };

function voicemailGreetingFromForm(formData: FormData): VoicemailGreetingForm {
  return {
    mode: normalizeVoicemailGreetingMode(String(formData.get('voicemailGreetingMode') ?? 'text')),
    text: String(formData.get('voicemailGreeting') ?? ''),
    recordingPath: String(formData.get('voicemailGreetingRecordingPath') ?? '').trim(),
  };
}

function voicemailGreetingSaveError(error: { message: string }): PhoneActionState {
  // Until the voicemail_greeting_config migration is applied, the mode and
  // recording-path columns do not exist; say so plainly instead of
  // surfacing a schema error. (The per-extension text column already
  // exists, but the slot is saved as one unit so the modes stay honest.)
  if (/voicemail_greeting|column|schema cache/i.test(error.message))
    return {
      ok: false,
      message:
        'Voicemail greetings cannot be saved yet — the database update for this feature has not been applied. Nothing else was changed.',
    };
  return { ok: false, message: error.message };
}

function validateVoicemailGreetingForm(
  greeting: VoicemailGreetingForm,
): { ok: false; message: string } | { ok: true; text: string } {
  const validated = validateVoicemailGreetingText(greeting.text);
  if (!validated.ok) return validated;
  if (greeting.mode === 'recording' && !greeting.recordingPath)
    return {
      ok: false,
      message:
        'Record your greeting first (or switch back to a typed greeting) — there is no recording to save yet.',
    };
  if (greeting.recordingPath && !greeting.recordingPath.endsWith('.webm') && !/\.(ogg|mp4|m4a|mp3|wav)$/i.test(greeting.recordingPath))
    return { ok: false, message: 'That recording file is not a supported audio type.' };
  return { ok: true, text: validated.text };
}

const VOICEMAIL_GREETING_SAVED_MESSAGE =
  'Voicemail greeting saved. The phone system applies saved greetings when its greeting update runs; callers then hear the new greeting instead of the standard one.';

/**
 * The default voicemail greeting for the whole phone system — also what
 * the operator (Admin) mailbox plays. Typed text is spoken by the phone
 * system's voice; a recording is played as-is.
 */
export async function saveVoicemailGreetingSettings(
  _state: PhoneActionState,
  formData: FormData,
): Promise<PhoneActionState> {
  try {
    const { db, id } = await requireSystemId();
    const greeting = voicemailGreetingFromForm(formData);
    const validated = validateVoicemailGreetingForm(greeting);
    if (!validated.ok) return validated;
    const { error } = await db
      .from('phone_systems')
      .update({
        voicemail_greeting: greeting.mode === 'text' ? validated.text || null : null,
        voicemail_greeting_mode: greeting.mode,
        voicemail_greeting_recording_path:
          greeting.mode === 'recording' ? greeting.recordingPath : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return voicemailGreetingSaveError(error);
    revalidatePath('/phone');
    return {
      ok: true,
      message:
        greeting.mode === 'text' && !validated.text
          ? 'Default voicemail greeting cleared. Callers hear the standard voicemail prompts until a greeting is set.'
          : VOICEMAIL_GREETING_SAVED_MESSAGE,
    };
  } catch (error) {
    return failure(error, 'Unable to save the voicemail greeting.');
  }
}

/**
 * One extension's own voicemail greeting, overriding the system default
 * for that person's mailbox. Saving an empty typed greeting (or recording
 * mode with no recording is rejected above) clears the override so the
 * mailbox falls back to the system default.
 */
export async function saveExtensionVoicemailGreetingSettings(
  _state: PhoneActionState,
  formData: FormData,
): Promise<PhoneActionState> {
  try {
    const { db, workspace } = await requireWorkspace();
    const extensionId = String(formData.get('extensionId') ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(extensionId))
      return { ok: false, message: 'Choose a valid extension.' };
    const greeting = voicemailGreetingFromForm(formData);
    const validated = validateVoicemailGreetingForm(greeting);
    if (!validated.ok) return validated;
    const { data: updated, error } = await db
      .from('communication_extensions')
      .update({
        voicemail_greeting: greeting.mode === 'text' ? validated.text || null : null,
        voicemail_greeting_mode: greeting.mode,
        voicemail_greeting_recording_path:
          greeting.mode === 'recording' ? greeting.recordingPath : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', extensionId)
      .eq('workspace_id', workspace.id)
      .select('id')
      .maybeSingle();
    if (error) return voicemailGreetingSaveError(error);
    if (!updated)
      return { ok: false, message: 'That extension does not belong to this phone system.' };
    revalidatePath('/phone');
    return {
      ok: true,
      message:
        greeting.mode === 'text' && !validated.text
          ? 'Extension greeting cleared. That mailbox now uses the default voicemail greeting.'
          : VOICEMAIL_GREETING_SAVED_MESSAGE,
    };
  } catch (error) {
    return failure(error, 'Unable to save the extension voicemail greeting.');
  }
}

export async function addExternalNumber(
  _state: PhoneActionState,
  formData: FormData,
): Promise<PhoneActionState> {
  try {
    const { db, id } = await requireSystemId();
    const e164 = normalizeUsPhone(formData.get('phone'));
    const label = String(formData.get('label') ?? '').trim();
    if (!e164 || !label) return { ok: false, message: 'Enter a valid US number and label.' };
    const { error } = await db.from('phone_numbers').insert({
      phone_system_id: id,
      e164,
      label,
      source: 'external_forwarding',
      status: 'pending',
      is_primary: false,
    });
    if (error)
      return {
        ok: false,
        message: error.code === '23505' ? 'That number is already attached.' : error.message,
      };
    revalidatePath('/phone');
    return { ok: true, message: 'Number recorded as forwarding-only. Ownership was not changed.' };
  } catch (error) {
    return failure(error, 'Unable to add the number.');
  }
}

export async function removeExternalNumber(formData: FormData): Promise<void> {
  const { db, id } = await requireSystemId();
  const numberId = String(formData.get('phoneNumberId') ?? '');
  const { data: number } = await db
    .from('phone_numbers')
    .select('id,source,is_primary')
    .eq('id', numberId)
    .eq('phone_system_id', id)
    .maybeSingle();
  if (!number || number.source !== 'external_forwarding' || number.is_primary) {
    throw new Error('Only a non-primary external forwarding record can be removed here.');
  }
  const { error } = await db.from('phone_numbers').delete().eq('id', number.id);
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
}

export async function addDestination(
  _state: PhoneActionState,
  _formData: FormData,
): Promise<PhoneActionState> {
  return {
    ok: false,
    message:
      'Employee personal-number forwarding is disabled. Assign a Program Holder extension so calls ring in the PWA.',
  };
}

export async function saveMenuOption(
  _state: PhoneActionState,
  formData: FormData,
): Promise<PhoneActionState> {
  try {
    const { db, id } = await requireSystemId();
    const digit = validMenuDigit(formData.get('digit'));
    const label = String(formData.get('label') ?? '').trim();
    const destinationId = String(formData.get('destinationId') ?? '');
    if (digit === null || !label || !destinationId)
      return { ok: false, message: 'Choose a digit, label, and destination.' };
    const { data: destination } = await db
      .from('phone_destinations')
      .select('id')
      .eq('id', destinationId)
      .eq('phone_system_id', id)
      .maybeSingle();
    if (!destination)
      return { ok: false, message: 'That destination does not belong to this phone system.' };
    const spokenKeywords = String(formData.get('keywords') ?? '')
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
    const { error } = await db.from('phone_menu_options').upsert(
      {
        phone_system_id: id,
        digit,
        label,
        destination_id: destinationId,
        spoken_keywords: spokenKeywords,
        position: digit,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'phone_system_id,digit' },
    );
    if (error) return { ok: false, message: error.message };
    revalidatePath('/phone');
    return { ok: true, message: `Menu option ${digit} now routes to ${label}.` };
  } catch (error) {
    return failure(error, 'Unable to save the menu option.');
  }
}

export async function setDefaultDestination(formData: FormData): Promise<void> {
  const { db, id } = await requireSystemId();
  const destinationId = String(formData.get('destinationId') ?? '');
  const { data } = await db
    .from('phone_destinations')
    .select('id')
    .eq('id', destinationId)
    .eq('phone_system_id', id)
    .maybeSingle();
  if (!data) throw new Error('That destination does not belong to this phone system.');
  const { error } = await db
    .from('phone_systems')
    .update({ default_destination_id: destinationId, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
}

export async function toggleDestination(formData: FormData): Promise<void> {
  const { db, id } = await requireSystemId();
  const { error } = await db
    .from('phone_destinations')
    .update({
      enabled: String(formData.get('enabled')) === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', String(formData.get('destinationId') ?? ''))
    .eq('phone_system_id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
}

export async function removeDestination(formData: FormData): Promise<void> {
  const { db, id } = await requireSystemId();
  const destinationId = String(formData.get('destinationId') ?? '');
  const [{ data: system }, { data: destination }, { count: routes }] = await Promise.all([
    db.from('phone_systems').select('default_destination_id').eq('id', id).single(),
    db
      .from('phone_destinations')
      .select('destination_type')
      .eq('id', destinationId)
      .eq('phone_system_id', id)
      .maybeSingle(),
    db
      .from('phone_menu_options')
      .select('id', { count: 'exact', head: true })
      .eq('phone_system_id', id)
      .eq('destination_id', destinationId),
  ]);
  if (destination?.destination_type === 'webrtc') {
    throw new Error(
      'PWA routes are managed through Program Holder extensions and cannot be removed.',
    );
  }
  if (system?.default_destination_id === destinationId || (routes ?? 0) > 0) {
    throw new Error('Reassign the default destination and menu routes before removing this phone.');
  }
  const { error } = await db
    .from('phone_destinations')
    .delete()
    .eq('id', destinationId)
    .eq('phone_system_id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
}

export async function testDestination(formData: FormData): Promise<void> {
  // The retired carrier must never be used for a test call.
  // Use the authenticated Elevate/Asterisk PWA dial pad for extension calls.
  // Do not silently initiate a chargeable Twilio PSTN call from this action.
  await requireSystemId();
  void formData;
  throw new Error('Carrier-originated test calling is retired. Use Elevate Phone in the PWA to test an extension; live Twilio/PBX test-call support is not yet verified.');
}

export async function removeMenuOption(formData: FormData): Promise<void> {
  const { db, id } = await requireSystemId();
  const optionId = String(formData.get('menuOptionId') ?? '');
  const { error } = await db
    .from('phone_menu_options')
    .delete()
    .eq('id', optionId)
    .eq('phone_system_id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
}

export async function assignPhoneNumber(formData: FormData): Promise<void> {
  const { db, id } = await requireSystemId();
  const phoneNumberId = String(formData.get('phoneNumberId') ?? '');
  const profileId = String(formData.get('profileId') ?? '').trim() || null;
  const extension = String(formData.get('extension') ?? '').trim() || null;
  if (extension && !validPhoneExtension(extension)) {
    throw new Error('Use 0 for the operator or a 2 to 6 digit extension.');
  }
  const { data: number, error: numberError } = await db.from('phone_numbers')
    .select('assigned_profile_id').eq('id', phoneNumberId).eq('phone_system_id', id).single();
  if (numberError || !number) throw new Error('Select a valid phone number.');
  // Retain an existing assignee even when no longer present in the directory.
  // A changed assignee must belong to the number's phone-system organization.
  if (profileId && profileId !== number.assigned_profile_id) {
    const { data: system, error: systemError } = await db.from('phone_systems')
      .select('tenant_id').eq('id', id).single();
    if (systemError || !system) throw new Error('Unable to load phone system.');
    const { data: profile, error: profileError } = await scopePhoneProfileQuery(
      db.from('profiles').select('id,role'), system.tenant_id ?? null,
    ).eq('id', profileId)
      .in('role', ['admin', 'super_admin', 'staff', 'program_holder', 'programholder', 'site_coordinator'])
      .maybeSingle();
    if (profileError || !profile) throw new Error('Select a valid team member in this phone system.');
  }
  const { error } = await db
    .from('phone_numbers')
    .update({ assigned_profile_id: profileId, extension, updated_at: new Date().toISOString() })
    .eq('id', phoneNumberId)
    .eq('phone_system_id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
  revalidatePath('/program-holder/dashboard');
}

export async function saveProgramHolderExtension(formData: FormData): Promise<void> {
  const { db, workspace } = await requireWorkspace();
  const profileId = String(formData.get('profileId') ?? '').trim();
  const extension = String(formData.get('extension') ?? '').trim();
  const department = String(formData.get('department') ?? '').trim() || null;
  if (!profileId || !validPhoneExtension(extension)) {
    throw new Error('Select a staff member or Program Holder and enter 0 for the operator or a 2 to 6 digit extension.');
  }
  const { error } = await db.rpc('save_phone_extension', {
    p_workspace_id: workspace.id,
    p_profile_id: profileId,
    p_extension: extension,
    p_department: department,
  });
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
  revalidatePath('/program-holder/dashboard');
}

export async function toggleExtension(formData: FormData): Promise<void> {
  const { db, workspace } = await requireWorkspace();
  const { error } = await db
    .from('communication_extensions')
    .update({
      enabled: String(formData.get('enabled')) === 'true',
      updated_at: new Date().toISOString(),
    })
    .eq('id', String(formData.get('extensionId') ?? ''))
    .eq('workspace_id', workspace.id);
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
}

export async function destinationActionResult(_state:PhoneActionState,formData:FormData):Promise<PhoneActionState>{
 try{
  const command=String(formData.get('command')||'');
  if(command==='default'){await setDefaultDestination(formData);return {ok:true,message:'Default call route saved.'};}
  if(command==='toggle'){await toggleDestination(formData);return {ok:true,message:String(formData.get('enabled'))==='true'?'Call route enabled.':'Call route paused.'};}
  if(command==='test'){await testDestination(formData);return {ok:true,message:'Test call requested. Answer the destination and verify two-way audio.'};}
  return {ok:false,message:'Choose a valid phone action.'};
 }catch(error){return failure(error,'The phone action could not be completed.');}
}

export async function createMeetingResult(_state:PhoneActionState,formData:FormData):Promise<PhoneActionState>{
 try{await createMeeting(formData);return {ok:true,message:'Meeting saved. Copy or share its link from the meeting list below.'};}catch(error){return failure(error,'The meeting could not be created.');}
}
