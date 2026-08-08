import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { CalendarDays, CheckCircle2, MapPin, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getPastEvents, getUpcomingEvents, eventTypeLabel, formatEventDate } from '@/lib/data/events';
import { recordPointsEvent } from '@/lib/gamification/points';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Events | Elevate LMS',
  description: 'Orientations, workshops, career events, webinars, and learner community events.',
  robots: { index: false, follow: false },
};

async function toggleRegistration(formData: FormData) {
  'use server';
  const eventId = String(formData.get('eventId') || '');
  if (!eventId) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/events');

  const { data: existing } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('event_registrations').delete().eq('id', existing.id).eq('user_id', user.id);
  } else {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({ event_id: eventId, user_id: user.id, status: 'registered', registered_at: new Date().toISOString() })
      .select('id')
      .single();
    if (!error && data) {
      await recordPointsEvent({ userId: user.id, eventType: 'event_registered', sourceId: eventId, points: 5 });
    }
  }
  revalidatePath('/lms/events');
}

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/events');

  const [upcoming, past, registrationResult] = await Promise.all([
    getUpcomingEvents({ limit: 30 }),
    getPastEvents({ limit: 6 }),
    supabase.from('event_registrations').select('event_id,status,attended').eq('user_id', user.id),
  ]);
  const registrations = new Map((registrationResult.data ?? []).map((row: any) => [row.event_id, row]));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <section className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Events</p>
        <h1 className="mt-2 text-3xl font-black">Everything happening in one calendar.</h1>
        <p className="mt-2 max-w-2xl text-slate-300">Orientations, workshops, webinars, networking, career fairs, graduation events, and community sessions live here.</p>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black text-slate-950">Upcoming</h2><p className="text-sm text-slate-600">Register once and keep your learner schedule in one place.</p></div><CalendarDays className="h-7 w-7 text-brand-blue-600" /></div>
        {!upcoming.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No upcoming events are currently published.</div>}
        <div className="grid gap-4 lg:grid-cols-2">
          {upcoming.map((event) => {
            const registration = registrations.get(event.id);
            return (
              <article key={event.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{eventTypeLabel(event.event_type || 'event')}</span><h3 className="mt-3 text-xl font-black text-slate-950">{event.title}</h3></div>{registration && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{event.description || 'Details will be shared with registered participants.'}</p>
                <div className="mt-4 space-y-2 text-sm font-semibold text-slate-700"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatEventDate(event.start_date, event.end_date)}</div><div className="flex items-center gap-2">{event.is_virtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}{event.is_virtual ? 'Virtual event' : (event.location || 'Location to be announced')}</div></div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <form action={toggleRegistration}><input type="hidden" name="eventId" value={event.id} /><button className={`rounded-xl px-4 py-2.5 text-sm font-black ${registration ? 'border border-slate-300 bg-white text-slate-700' : 'bg-brand-blue-600 text-white'}`}>{registration ? 'Cancel registration' : 'Register'}</button></form>
                  {registration && event.is_virtual && event.virtual_link && <Link href={event.virtual_link} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white">Join virtual event</Link>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {!!past.length && <section className="mt-10"><h2 className="text-xl font-black text-slate-950">Recent events</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{past.map((event) => <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wide text-slate-500">{eventTypeLabel(event.event_type || 'event')}</p><h3 className="mt-1 font-black text-slate-900">{event.title}</h3><p className="mt-2 text-sm text-slate-600">{formatEventDate(event.start_date, event.end_date)}</p></div>)}</div></section>}
    </main>
  );
}
