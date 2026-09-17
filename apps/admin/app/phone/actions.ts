'use server';

import { revalidatePath } from 'next/cache';
import { requireRole, type AuthResult } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { businessHoursFromForm, normalizeUsPhone, validMenuDigit } from '@/lib/phone/config';
import { ensureLiveKitRoom, liveKitReadiness } from '@/lib/communications/livekit';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';

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
  return { db, tenantId };
}

async function requireSystemId() {
  const { db, tenantId } = await requirePhoneContext();
  const { data: existing, error } = await scopeSystemQuery(
    db.from('phone_systems').select('id').limit(1),
    tenantId,
  ).maybeSingle();
  if (error) throw new Error(`Unable to load phone system: ${error.message}`);
  if (existing?.id) return { db, id: existing.id as string };
  const { data, error: insertError } = await db
    .from('phone_systems')
    .insert({ name: 'Elevate Communications', tenant_id: tenantId })
    .select('id')
    .single();
  if (insertError) throw new Error(`Unable to create phone system: ${insertError.message}`);
  return { db, id: data.id as string };
}

async function requireWorkspace() {
  const { db, tenantId } = await requirePhoneContext();
  const { id: phoneSystemId } = await requireSystemId();
  let query = db.from('communication_workspaces').select('*').limit(1);
  query = tenantId ? query.eq('tenant_id', tenantId) : query.is('tenant_id', null);
  const { data: existing, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (existing) return { db, workspace: existing };
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
  const title = String(formData.get('title') ?? '').trim();
  const roomType = String(formData.get('roomType') ?? 'meeting');
  if (title.length < 3 || title.length > 120)
    throw new Error('Meeting title must be 3–120 characters.');
  if (!['meeting', 'team_huddle', 'webinar', 'support', 'classroom'].includes(roomType)) {
    throw new Error('Choose a valid meeting type.');
  }
  const readiness = liveKitReadiness();
  if (!readiness.ready)
    throw new Error(`Meeting service is not configured: ${readiness.missing.join(', ')}`);
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const { db, workspace } = await requireWorkspace();
  const roomKey = `elevate-${workspace.id}-${crypto.randomUUID()}`;
  await ensureLiveKitRoom(roomKey, 50);
  const { error } = await db.from('communication_rooms').insert({
    workspace_id: workspace.id,
    room_key: roomKey,
    title,
    room_type: roomType,
    host_profile_id: auth.profile.id,
    status: 'open',
    started_at: new Date().toISOString(),
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
    if (!['menu', 'ai_receptionist', 'direct_forward'].includes(routingMode)) {
      return { ok: false, message: 'Choose a valid call-routing mode.' };
    }
    if (!maxQueueSeconds)
      return { ok: false, message: 'Queue time must be between 15 and 600 seconds.' };

    const aiEnabled = checked(formData, 'aiEnabled');
    const aiInstructions = String(formData.get('aiInstructions') ?? '').trim();
    if (aiEnabled && aiInstructions.length < 20) {
      return { ok: false, message: 'Give the AI receptionist clear operating instructions.' };
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
    return { ok: true, message: 'Phone routing, hours, voicemail, and AI settings saved.' };
  } catch (error) {
    return failure(error, 'Unable to save phone settings.');
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

export async function addDestination(
  _state: PhoneActionState,
  formData: FormData,
): Promise<PhoneActionState> {
  try {
    const { db, id } = await requireSystemId();
    const name = String(formData.get('name') ?? '').trim();
    const destination = normalizeUsPhone(formData.get('destination'));
    const ringSeconds = boundedInteger(formData.get('ringSeconds'), 5, 120);
    if (!name || !destination || !ringSeconds) {
      return {
        ok: false,
        message: 'Enter a name, valid cell phone, and ring time from 5 to 120 seconds.',
      };
    }
    const { error } = await db.from('phone_destinations').insert({
      phone_system_id: id,
      name,
      department: String(formData.get('department') ?? '').trim() || null,
      destination_type: 'phone',
      destination,
      ring_seconds: ringSeconds,
      fallback_to_voicemail: checked(formData, 'fallbackToVoicemail'),
    });
    if (error) return { ok: false, message: error.message };
    revalidatePath('/phone');
    return { ok: true, message: `${name} is now available as a cell-phone ring destination.` };
  } catch (error) {
    return failure(error, 'Unable to add the destination.');
  }
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

export async function assignPhoneNumber(formData: FormData): Promise<void> {
  const { db, id } = await requireSystemId();
  const phoneNumberId = String(formData.get('phoneNumberId') ?? '');
  const profileId = String(formData.get('profileId') ?? '').trim() || null;
  const extension = String(formData.get('extension') ?? '').trim() || null;
  if (extension && !/^\d{2,6}$/.test(extension)) {
    throw new Error('Extension must contain 2 to 6 digits.');
  }
  if (profileId) {
    const { data: profile } = await db
      .from('profiles')
      .select('id,role')
      .eq('id', profileId)
      .in('role', ['program_holder', 'programholder'])
      .maybeSingle();
    if (!profile) throw new Error('Select a valid Program Holder account.');
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
  if (!profileId || !/^\d{2,6}$/.test(extension)) {
    throw new Error('Select a Program Holder and enter a 2 to 6 digit extension.');
  }
  const { data: profile } = await db
    .from('profiles')
    .select('id,full_name,email,role')
    .eq('id', profileId)
    .in('role', ['program_holder', 'programholder'])
    .maybeSingle();
  if (!profile) throw new Error('Select a valid Program Holder account.');
  const { error } = await db.from('communication_extensions').upsert(
    {
      workspace_id: workspace.id,
      profile_id: profile.id,
      extension,
      display_name: profile.full_name || profile.email || 'Program Holder',
      department,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'workspace_id,profile_id' },
  );
  if (error) throw new Error(error.message);
  revalidatePath('/phone');
  revalidatePath('/program-holder/dashboard');
}
