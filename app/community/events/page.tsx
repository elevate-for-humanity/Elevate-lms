import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, MapPin, Users, Video, ArrowRight, Plus } from 'lucide-react';
import RSVPButton from './RSVPButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Events | Community | Elevate For Humanity',
  description: 'Join live workshops, webinars, networking events, and Q&A sessions with our community.',
};

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const supabase = await createClient();

  // Fetch events from database
  const { data: events, error } = await supabase
    .from('community_events')
    .select(`
      id,
      title,
      description,
      event_type,
      start_date,
      end_date,
      location_type,
      location_url,
      location_address,
      image_url,
      max_attendees,
      status,
      is_featured,
      organizer_id
    `)
    .in('status', ['upcoming', 'live'])
    .eq('is_public', true)
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(20);

  if (error) {
    console.error('Error fetching events:', error.message);
  }

  // Get RSVP counts for each event
  const eventIds = events?.map(e => e.id) || [];
  const rsvpCounts: Record<string, number> = {};
  
  if (eventIds.length > 0) {
    const { data: rsvps } = await supabase
      .from('community_event_rsvps')
      .select('event_id')
      .in('event_id', eventIds)
      .eq('status', 'registered');
    
    if (rsvps) {
      rsvps.forEach((r: any) => {
        rsvpCounts[r.event_id] = (rsvpCounts[r.event_id] || 0) + 1;
      });
    }
  }

  // Get current user's RSVPs
  const { data: { user } } = await supabase.auth.getUser();
  let userRsvps: string[] = [];
  
  if (user && eventIds.length > 0) {
    const { data: myRsvps } = await supabase
      .from('community_event_rsvps')
      .select('event_id')
      .eq('user_id', user.id)
      .in('event_id', eventIds)
      .eq('status', 'registered');
    
    userRsvps = myRsvps?.map((r: any) => r.event_id) || [];
  }

  const eventList = events || [];

  const eventTypeLabels: Record<string, string> = {
    'workshop': 'Workshop',
    'webinar': 'Webinar',
    'networking': 'Networking',
    'qa': 'Q&A Session',
    'panel': 'Panel',
    'meetup': 'Meetup',
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-brand-blue-500';
      case 'networking': return 'bg-green-500';
      case 'qa': return 'bg-orange-500';
      case 'webinar': return 'bg-brand-blue-500';
      case 'panel': return 'bg-pink-500';
      case 'meetup': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Community', href: '/community' }, { label: 'Events' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-brand-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-brand-blue-200" />
              <span className="text-brand-blue-200 font-medium">Community Events</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Learn, Connect, and Grow Together
            </h1>
            <p className="text-xl text-brand-blue-100 mb-6">
              Join live workshops, webinars, networking events, and Q&A sessions with industry experts and fellow community members.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#upcoming"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-700 font-semibold rounded-lg hover:bg-brand-blue-50 transition"
              >
                View Upcoming Events
                <ArrowRight className="w-5 h-5" />
              </Link>
              {user && (
                <Link
                  href="/community/events/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-500 transition border border-brand-blue-400"
                >
                  <Plus className="w-5 h-5" />
                  Create Event
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="upcoming" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
            <span className="text-gray-500">{eventList.length} events</span>
          </div>

          {eventList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Upcoming Events</h3>
              <p className="text-gray-600 mb-6">Check back soon for new events!</p>
              {user && (
                <Link
                  href="/community/events/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700"
                >
                  <Plus className="w-5 h-5" />
                  Create the First Event
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventList.map((event: any) => {
                const attendeeCount = rsvpCounts[event.id] || 0;
                const isRegistered = userRsvps.includes(event.id);
                const isLive = event.status === 'live';
                
                return (
                  <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-lg transition">
                    <div className="relative h-40">
                      {event.image_url ? (
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-brand-blue-600 flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white ${getEventTypeColor(event.event_type)}`}>
                        {eventTypeLabels[event.event_type] || event.event_type}
                      </span>
                      {isLive && (
                        <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                      
                      <div className="space-y-2 mb-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatEventDate(event.start_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatEventTime(event.start_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          {event.location_type === 'online' ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                          {event.location_type === 'online' ? 'Online Event' : event.location_address || 'In Person'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {attendeeCount} attending
                          {event.max_attendees && ` / ${event.max_attendees} max`}
                        </div>
                      </div>

                      <RSVPButton 
                        eventId={event.id} 
                        isRegistered={isRegistered}
                        isLoggedIn={!!user}
                        isFull={event.max_attendees ? attendeeCount >= event.max_attendees : false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Want to Host an Event?</h2>
          <p className="text-brand-blue-100 mb-6">
            Share your expertise with the community by hosting a workshop, webinar, or Q&A session.
          </p>
          <Link
            href={user ? "/community/events/create" : "/login?redirect=/community/events/create"}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-blue-600 font-semibold rounded-lg hover:bg-brand-blue-50 transition"
          >
            {user ? 'Create Event' : 'Sign In to Create Event'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
