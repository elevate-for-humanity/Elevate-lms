import type { Metadata } from 'next';
import Link from 'next/link';
import { Bot, Phone, PhoneForwarded, Radio, Users, Video, Voicemail, Workflow } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { formatUsPhone, parseBusinessHours } from '@/lib/phone/config';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import {
  CapabilityGuide,
  NewSystemNotice,
  PhoneSetupForms,
  type PhoneSettings,
} from './PhoneSetupForms';
import {
  dismissCommunicationsAnnouncement,
  setDefaultDestination,
  toggleDestination,
} from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Communications Hub' };

export default async function PhonePage() {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const db = await requireAdminClient();
  const tenantId = auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
  let systemQuery = db.from('phone_systems').select('*').limit(1);
  systemQuery = tenantId
    ? systemQuery.eq('tenant_id', tenantId)
    : systemQuery.is('tenant_id', null);
  const { data: system } = await systemQuery.maybeSingle();
  const systemId = system?.id as string | undefined;

  const [
    numbersResult,
    destinationsResult,
    menuResult,
    callsResult,
    voicemailResult,
    workspaceResult,
  ] = systemId
    ? await Promise.all([
        db.from('phone_numbers').select('*').eq('phone_system_id', systemId).order('created_at'),
        db
          .from('phone_destinations')
          .select('*')
          .eq('phone_system_id', systemId)
          .order('priority')
          .order('created_at'),
        db
          .from('phone_menu_options')
          .select('*, destination:phone_destinations(name)')
          .eq('phone_system_id', systemId)
          .order('position'),
        db
          .from('phone_calls')
          .select('*', { count: 'exact', head: true })
          .eq('phone_system_id', systemId),
        db
          .from('voicemails')
          .select('*', { count: 'exact', head: true })
          .eq('phone_system_id', systemId)
          .eq('is_read', false),
        db
          .from('communication_workspaces')
          .select('id,status')
          .eq('phone_system_id', systemId)
          .maybeSingle(),
      ])
    : ([
        { data: [] },
        { data: [] },
        { data: [] },
        { count: 0 },
        { count: 0 },
        { data: null },
      ] as any);

  const numbers = numbersResult.data ?? [];
  const destinations = destinationsResult.data ?? [];
  const menuOptions = menuResult.data ?? [];
  const settings: PhoneSettings = {
    greeting: system?.greeting ?? 'Thank you for calling Elevate for Humanity.',
    afterHours:
      system?.after_hours_message ??
      'Our office is currently closed. Please leave a message and we will return your call.',
    routingMode: system?.routing_mode ?? 'menu',
    timezone: system?.timezone ?? 'America/Indiana/Indianapolis',
    businessHours: parseBusinessHours(
      system?.business_hours ?? {
        mon: ['09:00', '17:00'],
        tue: ['09:00', '17:00'],
        wed: ['09:00', '17:00'],
        thu: ['09:00', '17:00'],
        fri: ['09:00', '17:00'],
      },
    ),
    voicemailEnabled: system?.voicemail_enabled ?? true,
    voicemailTranscriptionEnabled: system?.voicemail_transcription_enabled ?? true,
    callRecordingEnabled: system?.call_recording_enabled ?? false,
    recordingDisclosure: system?.recording_disclosure ?? '',
    maxQueueSeconds: system?.max_queue_seconds ?? 90,
    aiEnabled: system?.ai_enabled ?? false,
    aiName: system?.ai_name ?? 'Elevate Assistant',
    aiVoice: system?.ai_voice ?? 'natural',
    aiLanguage: system?.ai_language ?? 'en-US',
    aiInstructions:
      system?.ai_instructions ??
      'Answer questions about Elevate for Humanity, collect caller information, and transfer to a person when requested or uncertain.',
    aiAllowInterruptions: system?.ai_allow_interruptions ?? true,
    aiHumanHandoffEnabled: system?.ai_human_handoff_enabled ?? true,
  };

  const cards = [
    ['Business numbers', numbers.length, Phone],
    ['Team phones', destinations.length, PhoneForwarded],
    ['Calls', callsResult.count ?? 0, Workflow],
    ['New voicemail', voicemailResult.count ?? 0, Voicemail],
  ] as const;
  const carrierReady = numbers.some(
    (number: any) => number.source === 'provider' && number.status === 'active',
  );
  const meetingReady = workspaceResult.data?.status === 'active';
  const { data: onboarding } = workspaceResult.data?.id
    ? await db
        .from('communication_onboarding_progress')
        .select('announcement_seen_at')
        .eq('workspace_id', workspaceResult.data.id)
        .eq('user_id', auth.profile.id)
        .maybeSingle()
    : { data: null };

  return (
    <main className="space-y-6 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-600">
            Calls · Meetings · Team communications
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Elevate Communications Hub</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Manage business numbers, team cell phones, extensions, call routing, AI reception, video
            meetings, screen sharing, and communication history.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/phone/meetings"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-black text-white"
          >
            <Video className="h-4 w-4" />
            Meetings
          </Link>
          <Link
            href="/inbox"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-800"
          >
            Inbox
          </Link>
        </div>
      </div>
      {!onboarding?.announcement_seen_at ? (
        <NewSystemNotice dismissAction={dismissCommunicationsAnnouncement} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-orange-600" />
            <p className="mt-3 text-2xl font-black">{value}</p>
            <p className="text-sm font-semibold text-slate-600">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div
          className={`rounded-xl border p-4 text-sm ${carrierReady ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-amber-200 bg-amber-50 text-amber-950'}`}
        >
          <div className="flex items-center gap-2 font-black">
            <Radio className="h-4 w-4" />
            Phone network: {carrierReady ? 'Connected' : 'Setup required'}
          </div>
          <p className="mt-1">
            {carrierReady
              ? 'A carrier number is active for this organization.'
              : 'Dashboard configuration is available, but live calls require a verified carrier number and connection.'}
          </p>
        </div>
        <div
          className={`rounded-xl border p-4 text-sm ${meetingReady ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'border-blue-200 bg-blue-50 text-blue-950'}`}
        >
          <div className="flex items-center gap-2 font-black">
            <Video className="h-4 w-4" />
            Meeting service: {meetingReady ? 'Connected' : 'Infrastructure pending'}
          </div>
          <p className="mt-1">
            {meetingReady
              ? 'Elevate-owned browser rooms are available.'
              : 'The dashboard model is ready; the self-hosted WebRTC service must be provisioned before live rooms are enabled.'}
          </p>
        </div>
      </div>
      <CapabilityGuide />
      <PhoneSetupForms
        settings={settings}
        destinations={destinations.map((item: any) => ({
          id: item.id,
          name: item.name,
          destination: item.destination,
          enabled: item.enabled,
        }))}
      />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black">Numbers</h2>
          {numbers.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {numbers.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <b>{item.label}</b>
                    <br />
                    <span className="text-slate-600">
                      {formatUsPhone(item.e164)} ·{' '}
                      {item.source === 'external_forwarding'
                        ? 'owned elsewhere / forwarding only'
                        : 'workspace number'}
                    </span>
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No numbers attached yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black">Team cell phones</h2>
          {destinations.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {destinations.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>
                    <b>{item.name}</b>
                    {item.department ? (
                      <span className="ml-2 text-xs text-slate-500">{item.department}</span>
                    ) : null}
                    <br />
                    <span className="text-slate-600">
                      {formatUsPhone(item.destination)} · rings {item.ring_seconds}s
                    </span>
                  </span>
                  <div className="flex gap-2">
                    {system?.default_destination_id !== item.id ? (
                      <form action={setDefaultDestination}>
                        <input type="hidden" name="destinationId" value={item.id} />
                        <button className="rounded-lg border px-2 py-1 text-xs font-bold">
                          Make default
                        </button>
                      </form>
                    ) : (
                      <span className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">
                        Default
                      </span>
                    )}
                    <form action={toggleDestination}>
                      <input type="hidden" name="destinationId" value={item.id} />
                      <input type="hidden" name="enabled" value={String(!item.enabled)} />
                      <button className="rounded-lg border px-2 py-1 text-xs font-bold">
                        {item.enabled ? 'Pause' : 'Enable'}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Add the first team cell phone that should receive business calls.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-700" />
          <h2 className="font-black">Active call routes</h2>
        </div>
        {menuOptions.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {menuOptions.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-black">
                  Press or say {item.digit}: {item.label}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Rings {item.destination?.name ?? 'unassigned'}
                </p>
                {item.spoken_keywords?.length ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Keywords: {item.spoken_keywords.join(', ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No menu routes configured yet.</p>
        )}
      </section>
      <aside className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <b>Number protection:</b> external numbers such as 317-314-3757 remain with their current
        provider. Elevate records them as forwarding-only and never treats them as ported numbers.
      </aside>
    </main>
  );
}
