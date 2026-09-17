import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarPlus, MonitorUp, ShieldCheck, Users, Video } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createMeeting } from '../actions';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import { liveKitReadiness } from '@/lib/communications/livekit';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Team Meetings' };

export default async function MeetingsPage() {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const db = await requireAdminClient();
  const tenantId = auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
  let workspaceQuery = db
    .from('communication_workspaces')
    .select('id,status,name,meeting_provider')
    .limit(1);
  workspaceQuery = tenantId
    ? workspaceQuery.eq('tenant_id', tenantId)
    : workspaceQuery.is('tenant_id', null);
  const { data: workspace } = await workspaceQuery.maybeSingle();
  const { data: rooms } = workspace?.id
    ? await db
        .from('communication_rooms')
        .select('id,title,room_type,status,scheduled_at,max_participants,allow_screen_share')
        .eq('workspace_id', workspace.id)
        .order('scheduled_at', { ascending: false })
        .limit(20)
    : { data: [] };
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
              Video meetings, team huddles, guest invitations, screen sharing, chat, and attendance
              inside the dashboard.
            </p>
          </div>
          {serviceReady ? (
            <form action={createMeeting} className="flex flex-wrap items-center gap-2">
              <input
                name="title"
                required
                minLength={3}
                maxLength={120}
                placeholder="Meeting title"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
              <select
                name="roomType"
                className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                <option value="meeting">Meeting</option>
                <option value="team_huddle">Team huddle</option>
                <option value="classroom">Classroom</option>
                <option value="webinar">Webinar</option>
                <option value="support">Support</option>
              </select>
              <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-black text-white">
                <CalendarPlus className="h-4 w-4" />
                New meeting
              </button>
            </form>
          ) : null}
        </div>
      </div>

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
          [Users, 'Team and guests', 'Invite employees, learners, partners, or outside guests.'],
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
        <h2 className="text-lg font-black">Meeting rooms</h2>
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
                    href={`/phone/meetings/${room.id}`}
                    className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-black text-white"
                  >
                    Join
                  </Link>
                ) : null}
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
