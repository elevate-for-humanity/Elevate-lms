import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Video, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Calendar | Elevate Hub',
  description: 'View upcoming events, workshops, and study sessions.',
};

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  
  if (!supabase) redirect('/login');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/hub/calendar');

  // Fetch upcoming events
  const { data: events } = await db
    .from('events')
    .select('*')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(20);

  // Use real events only - no fake fallback data
  const displayEvents = events || [];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-brand-blue-500';
      case 'workshop': return 'bg-brand-blue-500';
      case 'webinar': return 'bg-brand-green-500';
      case 'networking': return 'bg-brand-orange-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
            <p className="text-slate-600 mt-1">Upcoming events and sessions</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700">
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>

        {/* Event Types Legend */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-blue-500"></div>
            <span className="text-sm text-slate-600">Study Sessions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-blue-500"></div>
            <span className="text-sm text-slate-600">Workshops</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-green-500"></div>
            <span className="text-sm text-slate-600">Webinars</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-orange-500"></div>
            <span className="text-sm text-slate-600">Networking</span>
          </div>
        </div>

        {/* Events List */}
        {displayEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No upcoming events</h3>
            <p className="text-slate-600">Check back later for scheduled events and sessions.</p>
          </div>
        ) : (
        <div className="space-y-4">
          {displayEvents.map((event: any) => (
            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="flex items-start gap-4">
                <div className={`w-1 h-full min-h-[80px] rounded-full ${getEventColor(event.event_type)}`}></div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{event.title}</h3>
                      <p className="text-slate-600 mt-1">{event.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getEventColor(event.event_type)}`}>
                      {event.event_type || 'Event'}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.start_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(event.start_date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                    {event.is_virtual ? (
                      <div className="flex items-center gap-1 text-brand-blue-600">
                        <Video className="w-4 h-4" />
                        Virtual Event
                      </div>
                    ) : event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users className="w-4 h-4" />
                      {event.attendee_count || 0} attending
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 text-sm">
                      RSVP
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}
