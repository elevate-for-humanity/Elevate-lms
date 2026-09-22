import type { Metadata } from 'next';
import Link from 'next/link';
import { Bot, Phone, PhoneForwarded, Radio, Video, Voicemail, Workflow } from 'lucide-react';
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
  removeExternalNumber,
  removeMenuOption,
  testDestination,
  toggleExtension,
  assignPhoneNumber,
  saveProgramHolderExtension,
} from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Communications Hub' };

export default async function PhonePage() {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const db = await requireAdminClient();
  const tenantId = auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
  const platformAdmin = auth.effectiveRoles.some(
    (role) => role === 'admin' || role === 'super_admin',
  );
  let systemQuery = db.from('phone_systems').select('*').limit(1);
  systemQuery = tenantId
    ? systemQuery.eq('tenant_id', tenantId)
    : systemQuery.is('tenant_id', null);
  const { data: tenantSystem } = await systemQuery.maybeSingle();
  const { data: platformSystem } =
    !tenantSystem && platformAdmin && tenantId
      ? await db.from('phone_systems').select('*').is('tenant_id', null).limit(1).maybeSingle()
      : { data: null };
  const system = tenantSystem ?? platformSystem;
  const systemId = system?.id as string | undefined;

  const [
    numbersResult,
    destinationsResult,
    menuResult,
    callsResult,
    voicemailResult,
    workspaceResult,
    programHoldersResult,
    extensionsResult,
    devicesResult,
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
        db
          .from('profiles')
          .select('id,full_name,email,role,program_holder_id')
          .in('role', ['program_holder', 'programholder'])
          .not('program_holder_id', 'is', null)
          .order('full_name'),
        db
          .from('communication_extensions')
          .select(
            'id,profile_id,extension,display_name,department,enabled,workspace:communication_workspaces!inner(phone_system_id)',
          )
          .eq('workspace.phone_system_id', systemId)
          .order('extension'),
        db
          .from('phone_webrtc_devices')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('last_seen_at', new Date(Date.now() - 120_000).toISOString()),
      ])
    : ([
        { data: [] },
        { data: [] },
        { data: [] },
        { count: 0 },
        { count: 0 },
        { data: null },
        { data: [] },
        { data: [] },
        { count: 0 },
      ] as any);

  const numbers = numbersResult.data ?? [];
  const destinations = destinationsResult.data ?? [];
  const menuOptions = menuResult.data ?? [];
  const programHolders = (programHoldersResult.data ?? []).filter(
    (profile: any) => !String(profile.email || '').endsWith('@qa.invalid'),
  );
  const extensions = extensionsResult.data ?? [];
  const settings: PhoneSettings = {
    greeting: system?.greeting ?? 'Thank you for calling Elevate for Humanity.',
    afterHours:
      system?.after_hours_message ??
      'Our office is currently closed. Please leave a message and we will return your call.',
    routingMode: system?.routing_mode === 'ai_receptionist' ? 'ai_receptionist' : 'menu',
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
    ['PWA routes', destinations.length, PhoneForwarded],
    ['Calls', callsResult.count ?? 0, Workflow],
    ['New voicemail', voicemailResult.count ?? 0, Voicemail],
  ] as const;
  const carrierReady = numbers.some(
    (number: any) => number.source === 'provider' && number.status === 'active',
  );
  const meetingReady = workspaceResult.data?.status === 'active';
  const primaryNumber = numbers.find(
    (number: any) =>
      number.source === 'provider' && number.status === 'active' && number.is_primary,
  );
  const routingReady =
    system?.routing_mode === 'ai_receptionist'
      ? Boolean(system?.ai_enabled)
      : menuOptions.some((option: any) => option.enabled && option.destination_id);
  const setupSteps = [
    { label: 'Assign PWA extensions', complete: destinations.some((item: any) => item.enabled) },
    { label: 'Choose call routing', complete: routingReady },
    { label: 'Create extensions', complete: extensions.some((item: any) => item.enabled) },
    { label: 'Connect one PWA phone', complete: (devicesResult.count ?? 0) > 0 },
    { label: 'Test before activation', complete: (callsResult.count ?? 0) > 0 },
  ];
  const phoneReady =
    Boolean(primaryNumber) && setupSteps.every((step) => step.complete) && carrierReady;
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
            Manage business numbers, PWA extensions, call routing, AI reception, video meetings,
            screen sharing, and communication history.
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
        <NewSystemNotice dismissAction={dismissCommunicationsAnnouncement} steps={setupSteps} />
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
            Phone network:{' '}
            {phoneReady
              ? 'Ready'
              : carrierReady
                ? 'Connected — setup incomplete'
                : 'Setup required'}
          </div>
          <p className="mt-1">
            {phoneReady
              ? 'The carrier, primary number, routing, PWA extensions, and call testing are complete.'
              : carrierReady
                ? 'The carrier is connected, but one or more routing, extension, destination, or testing steps are incomplete.'
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
                  <form
                    action={assignPhoneNumber}
                    className="grid min-w-64 gap-2 sm:grid-cols-[1fr_5rem_auto]"
                  >
                    <input type="hidden" name="phoneNumberId" value={item.id} />
                    <select
                      name="profileId"
                      defaultValue={item.assigned_profile_id ?? ''}
                      aria-label={`Assign ${item.label}`}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="">Unassigned</option>
                      {programHolders.map((profile: any) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.full_name || profile.email}
                        </option>
                      ))}
                    </select>
                    <input
                      name="extension"
                      inputMode="numeric"
                      pattern="[0-9]{2,6}"
                      defaultValue={item.extension ?? ''}
                      placeholder="Ext."
                      aria-label={`Extension for ${item.label}`}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                    />
                    <button className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">
                      Assign
                    </button>
                  </form>
                  {item.source === 'external_forwarding' && !item.is_primary ? (
                    <form action={removeExternalNumber}>
                      <input type="hidden" name="phoneNumberId" value={item.id} />
                      <button className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-bold text-rose-700">
                        Remove
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No numbers attached yet.</p>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-black">PWA call routes</h2>
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
                      {item.destination_type === 'webrtc'
                        ? `PWA extension ${extensions.find((extension: any) => extension.id === item.extension_id)?.extension ?? 'unassigned'}`
                        : item.destination_type === 'phone'
                          ? `Administrator fallback · ${formatUsPhone(item.destination)}`
                          : 'PARIS / voicemail route'}{' '}
                      · rings {item.ring_seconds}s
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
                    <form action={testDestination}>
                      <input type="hidden" name="destinationId" value={item.id} />
                      <button className="rounded-lg border border-indigo-300 px-2 py-1 text-xs font-bold text-indigo-700">
                        Test call
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Assign a Program Holder extension to create the first PWA call route.
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
                <form action={removeMenuOption} className="mt-3">
                  <input type="hidden" name="menuOptionId" value={item.id} />
                  <button className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-bold text-rose-700">
                    Remove route
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No menu routes configured yet.</p>
        )}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-black">Extension and phone directory</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each Program Holder sees their own extension and assigned business line in their
          dashboard.
        </p>
        <form
          action={saveProgramHolderExtension}
          className="mt-4 grid gap-3 md:grid-cols-[1fr_8rem_1fr_auto]"
        >
          <select
            name="profileId"
            required
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Choose Program Holder</option>
            {programHolders.map((profile: any) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || profile.email}
              </option>
            ))}
          </select>
          <input
            name="extension"
            required
            inputMode="numeric"
            pattern="[0-9]{2,6}"
            placeholder="Extension"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="department"
            placeholder="Program or department"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-black text-white">
            Save extension
          </button>
        </form>
        {extensions.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Extension</th>
                  <th className="px-3 py-2">Phone number</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {extensions.map((entry: any) => {
                  const assigned = numbers.find(
                    (number: any) => number.assigned_profile_id === entry.profile_id,
                  );
                  const primary = numbers.find((number: any) => number.is_primary);
                  return (
                    <tr key={entry.id} className="border-t border-slate-200">
                      <td className="px-3 py-2 font-bold">{entry.display_name}</td>
                      <td className="px-3 py-2">{entry.department || '—'}</td>
                      <td className="px-3 py-2">{entry.extension}</td>
                      <td className="px-3 py-2">{formatUsPhone((assigned || primary)?.e164)}</td>
                      <td className="px-3 py-2">
                        <form action={toggleExtension} className="flex items-center gap-2">
                          <input type="hidden" name="extensionId" value={entry.id} />
                          <input type="hidden" name="enabled" value={String(!entry.enabled)} />
                          <span>{entry.enabled ? 'Active' : 'Paused'}</span>
                          <button className="rounded border px-2 py-1 text-xs font-bold">
                            {entry.enabled ? 'Pause' : 'Enable'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">No extensions assigned yet.</p>
        )}
      </section>
      <aside className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <b>Number protection:</b> external numbers remain with their current provider. Elevate only
        stores an external number after an administrator intentionally adds it as forwarding-only.
      </aside>
    </main>
  );
}
