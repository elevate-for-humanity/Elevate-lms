import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUpcomingEvents } from '@/lib/data/events';
import EventCard from '@/components/events/EventCard';
import EventsEmptyState from '@/components/events/EventsEmptyState';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Calendar | Elevate Hub',
  description: 'Upcoming events, workshops, and study sessions for Elevate learners.',
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/calendar');

  const upcoming = await getUpcomingEvents({ limit: 20 });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Upcoming events, workshops, and sessions open to learners.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {upcoming.length === 0 ? (
          <EventsEmptyState
            message="No upcoming events scheduled. Check back soon or contact your advisor."
            ctaLabel="Contact advisor" ctaHref="/contact"
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Upcoming ({upcoming.length})</h2>
              <Link href="/events" className="text-sm text-brand-blue-600 hover:underline">View all public events →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
