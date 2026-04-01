import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://elevateforhumanity.org/rise-foundation/events',
  },
  title: 'Events | Rise Foundation',
  description: 'Join us for upcoming community events and programs.',
};

export default async function EventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true });

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-zinc-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
          <p className="text-xl text-indigo-100">
            Join us for workshops, training sessions, and community gatherings
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {!events || events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Upcoming Events
            </h3>
            <p className="text-slate-600 mb-6">
              Check back soon for new events and programs
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Contact Us for Information
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-900 flex-1">
                      {event.title}
                    </h3>
                    <Calendar className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                  </div>

                  {event.description && (
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {event.time && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                    )}

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.capacity && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4" />
                        <span>Capacity: {event.capacity}</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    RSVP Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
