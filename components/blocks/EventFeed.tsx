// Server component — fetches events from Supabase filtered by type
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface EventFeedProps {
  type?: string;        // filter by event category/type
  limit?: number;
  heading?: string;
}

export default async function EventFeed({
  type,
  limit = 6,
  heading = 'Upcoming Events',
}: EventFeedProps) {
  const supabase = await createClient();

  let query = supabase
    .from('events')
    .select('id, title, start_date, location, slug')
    .gte('start_date', new Date().toISOString())
    .order('start_date')
    .limit(limit);

  if (type) query = query.eq('type', type);

  const { data: events } = await query;

  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-slate-800">{heading}</h2>
        {!events || events.length === 0 ? (
          <p className="text-slate-500">No upcoming events.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={event.slug ? `/events/${event.slug}` : '#'}
                className="block p-5 border border-slate-200 rounded-xl hover:border-brand-blue-400 hover:shadow-md transition-all"
              >
                <p className="text-sm text-brand-blue-600 font-medium mb-1">
                  {new Date(event.start_date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
                <h3 className="font-semibold text-slate-800">{event.title}</h3>
                {event.location && (
                  <p className="text-sm text-slate-500 mt-1">{event.location}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
