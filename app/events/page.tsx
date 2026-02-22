import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Calendar, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Events | Elevate For Humanity',
  description: 'Discover upcoming workshops, seminars, info sessions, and career fairs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/events',
  },
};

export const dynamic = 'force-dynamic';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_time: string;
  end_time: string;
  location: string | null;
}

export default async function EventsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: upcomingEvents, error } = await db
    .from('events')
    .select('id, title, description, event_type, start_time, end_time, location')
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(12);

  const { data: pastEvents } = await db
    .from('events')
    .select('id, title, description, event_type, start_time, end_time, location')
    .lt('start_time', new Date().toISOString())
    .order('start_time', { ascending: false })
    .limit(6);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Events</h1>
          <p className="text-gray-600 mb-6">Unable to load events.</p>
          <Link href="/contact" className="text-brand-blue-600 hover:underline">
            Contact us for event information
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'info_session': 'Info Session',
      'workshop': 'Workshop',
      'career_fair': 'Career Fair',
      'graduation': 'Graduation',
      'networking': 'Networking',
    };
    return labels[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'info_session': 'bg-brand-blue-100 text-brand-blue-700',
      'workshop': 'bg-brand-blue-100 text-brand-blue-700',
      'career_fair': 'bg-brand-green-100 text-brand-green-700',
      'graduation': 'bg-yellow-100 text-yellow-700',
      'networking': 'bg-brand-orange-100 text-brand-orange-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Events' }]} />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-rose-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-rose-300" />
            <span className="text-rose-300 font-medium">Community</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events</h1>
          <p className="text-xl text-rose-100 max-w-2xl">
            Join us for workshops, info sessions, career fairs, and networking events.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
          
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event: Event) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${getEventTypeColor(event.event_type)}`}>
                        {getEventTypeLabel(event.event_type)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{event.title}</h3>
                    
                    {event.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 border-t">
                    <Link
                      href="/contact?type=event"
                      className="text-brand-blue-600 font-medium text-sm hover:underline"
                    >
                      Register / Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Events</h3>
              <p className="text-gray-600 mb-4">Check back soon for new events!</p>
              <Link href="/contact" className="text-brand-blue-600 hover:underline">
                Contact us for event information
              </Link>
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastEvents && pastEvents.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event: Event) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border p-6 opacity-75">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${getEventTypeColor(event.event_type)}`}>
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">{event.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(event.start_time)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-rose-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Want to Host an Event?</h2>
          <p className="text-rose-100 mb-6 max-w-xl mx-auto">
            Partner with us to host career fairs, workshops, or info sessions at your location.
          </p>
          <Link
            href="/contact?type=partner"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-600 font-semibold rounded-lg hover:bg-gray-100 transition"
          >
            Contact Us
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </div>
    </div>
  );
}
