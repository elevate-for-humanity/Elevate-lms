import { CalendarWidget } from '@/components/CalendarWidget';
import { VideoCallingGuide } from '@/components/communications/VideoCallingGuide';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MonitorUp, ShieldCheck, Users, Video } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import {NewMeetingForm} from './NewMeetingForm';
import {MeetingLinks} from './MeetingLinks';
import {hydrateProcessEnv} from '@/lib/secrets';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import { liveKitReadiness } from '@/lib/communications/livekit';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Team Meetings' };

export default async function MeetingsPage() {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const db = await requireAdminClient();
  const tenantId = auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
  const platformAdmin = auth.effectiveRoles.some(
    (role) => role === 'admin' || role === 'super_admin',
  );
  let workspaceQuery = db
    .from('communication_workspaces')
    .select('id,status,name,meeting_provider')
    .limit(1);
  workspaceQuery = tenantId
    ? workspaceQuery.eq('tenant_id', tenantId)
    : workspaceQuery.is('tenant_id', null);
  const { data: tenantWorkspace } = await workspaceQuery.maybeSingle();
  const { data: platformWorkspace } =
    !tenantWorkspace && platformAdmin && tenantId
      ? await db
          .from('communication_workspaces')
          .select('id,status,name,meeting_provider')
          .is('tenant_id', null)
          .limit(1)
          .maybeSingle()
      : { data: null };
  const workspace = tenantWorkspace ?? platformWorkspace;
  const { data: rooms } = workspace?.id
    ? await db
        .from('communication_rooms')
        .select('id,title,room_key,description,room_type,status,scheduled_at,max_participants,allow_screen_share')
        .eq('workspace_id', workspace.id)
        .order('scheduled_at', { ascending: false })
        .limit(20)
    : { data: [] };
  await hydrateProcessEnv();
  const readiness = liveKitReadiness();
  const serviceReady = readiness.ready;

  return (
    <main className="space-y-6 bg-slate-50 p-4 sm:p-6">
      <div>
        <Link
          href="/phone"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Communications Hub
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
              Elevate-owned browser rooms
            </p>
            <h1 className="mt-1 text-3xl font-black">Team Meetings</h1>
            <p className="mt-1 text-sm text-slate-600">
              Video meetings, team huddles, meeting invitations, screen sharing, chat, and attendance
              inside the dashboard.
            </p>
          </div>
          {serviceReady ? (
            <NewMeetingForm />
          ) : null}
        </div>
      </div>

      <VideoCallingGuide />
      <CalendarWidget userId={auth.profile.id} additionalEvents={(rooms || []).filter((room: any) => room.scheduled_at && !['cancelled', 'ended'].includes(room.status)).map((room: any) => ({ id: room.id, title: room.title, date: room.scheduled_at.slice(0, 10), startsAt: room.scheduled_at, type: 'event' as const }))} />

      {!serviceReady ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h2 className="font-black">Meeting infrastructure is not active yet</h2>
          <p className="mt-2 text-sm leading-6">
            Live rooms remain disabled until the Elevate-owned WebRTC service is deployed and its
            server credentials are stored securely. Missing configuration:{' '}
            {'missing' in readiness ? readiness.missing.join(', ') : 'workspace activation'}.
          </p>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          [Video, 'Browser video', 'Join without leaving the Elevate dashboard.'],
          [MonitorUp, 'Screen sharing', 'Present a browser tab, application, or screen.'],
          [Users, 'Meeting invitations', 'Share links with employees, learners, and partners who have an Elevate account.'],
          [
            ShieldCheck,
            'Tenant isolation',
            'Rooms and attendance stay inside the organization workspace.',
          ],
        ].map(([Icon, title, body]: any) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Icon className="h-5 w-5 text-indigo-700" />
            <h2 className="mt-3 font-black">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-black">Meeting rooms</h2><Link href="/phone/meetings/legacy83-presentation" className="rounded-lg bg-indigo-700 px-4 py-3 font-bold text-white">Present Legacy 83</Link></div>
        {rooms?.length ? (
          <div className="mt-4 divide-y divide-slate-100">
            {rooms.map((room: any) => (
              <div key={room.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-black">{room.title}</p>
                  <p className="text-sm text-slate-600">
                    {room.room_type.replaceAll('_', ' ')} ·{' '}
                    {room.scheduled_at
                      ? new Date(room.scheduled_at).toLocaleString()
                      : 'Instant room'}{' '}
                    · up to {room.max_participants}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-700">
                  {room.status}
                </span>
                {room.status !== 'cancelled' ? (
                  <Link
                    href={room.room_key?.startsWith('google-calendar-') && /^https:\/\/meet\.google\.com\/[a-z-]+$/.test(room.description ?? '') ? room.description : `/phone/meetings/${room.id}`}
                    target={room.room_key?.startsWith('google-calendar-') ? '_blank' : undefined}
                    className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-black text-white"
                  >
                    Join
                  </Link>
                ) : null}
                {room.status !== 'cancelled' && <MeetingLinks roomId={room.id} title={room.title} scheduledAt={room.scheduled_at} externalUrl={room.room_key?.startsWith('google-calendar-') && /^https:\/\/meet\.google\.com\/[a-z-]+$/.test(room.description ?? '') ? room.description : undefined} />}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Video className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-black">No meetings yet</p>
            <p className="mt-1 text-sm text-slate-600">
              Meeting creation becomes available after the owned WebRTC service passes its
              connection and media tests.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
