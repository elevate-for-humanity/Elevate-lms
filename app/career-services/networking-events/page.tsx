import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock, ArrowRight, Building2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Networking Events | Career Services | Elevate For Humanity',
  description: 'Connect with employers at career fairs, industry meetups, and networking events. Build relationships that lead to job opportunities.',
};

export const dynamic = 'force-dynamic';

export default async function NetworkingEventsPage() {
  const supabase = await createClient();

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

  // Get upcoming networking events
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'networking')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(6);

  // Get past events
  const { data: pastEvents } = await supabase
    .from('events')
    .select('*')
    .eq('event_type', 'networking')
    .lt('start_date', new Date().toISOString())
    .order('start_date', { ascending: false })
    .limit(3);

  // Get employer partners
  const { count: employerCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'employer');

  // Get event stats
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'networking');

  const eventTypes = [
    {
      title: 'Career Fairs',
      description: 'Meet multiple employers in one day. Bring your resume and dress professionally.',
      image: '/images/career-services/job-fair.jpg',
    },
    {
      title: 'Industry Meetups',
      description: 'Connect with professionals in your field. Learn about industry trends and opportunities.',
      image: '/images/career-services/industry-mixer.jpg',
    },
    {
      title: 'Employer Panels',
      description: 'Hear directly from hiring managers about what they look for in candidates.',
      image: '/images/career-services/resume-workshop.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Career Services', href: '/career-services' }, { label: 'Networking Events' }]} />
        </div>
      </div>

      {/* Hero */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/career-services/interview-prep.jpg" alt="Hero image" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Networking Events</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Connect with employers, build professional relationships, and discover job opportunities.</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-teal-600">{employerCount || 50}+</div>
              <div className="text-gray-600">Employer Partners</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">{totalEvents || 20}+</div>
              <div className="text-gray-600">Events Per Year</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-teal-600">Free</div>
              <div className="text-gray-600">For Students</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          {upcomingEvents && upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
                  {event.image_url && (
                    <div className="h-40 bg-gray-200 relative">
                      <Image src={event.image_url} alt={event.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-teal-600 text-sm mb-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {event.location}
                        </span>
                      )}
                      {event.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {event.start_time}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/events/${event.id}`}
                      className="inline-flex items-center gap-1 text-teal-600 font-medium hover:underline"
                    >
                      Register <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No Upcoming Events</h3>
              <p className="text-gray-600">Check back soon for new networking opportunities!</p>
            </div>
          )}
        </section>

        {/* Event Types */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Types of Events</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {eventTypes.map((type) => (
              <div key={type.title} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="h-40 relative">
                  <Image src={type.image} alt={type.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2">{type.title}</h3>
                  <p className="text-gray-600 text-sm">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Past Events */}
        {pastEvents && pastEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Past Events</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {pastEvents.map((event: any) => (
                <div key={event.id} className="bg-white rounded-xl shadow-sm border p-5 opacity-75">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                  <h3 className="font-semibold">{event.title}</h3>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* CTA */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Want to Host an Event?</h2>
          <p className="text-xl text-teal-100 mb-8">
            Employers can partner with us to host recruiting events and meet qualified candidates.
          </p>
          <Link
            href="/partner"
            className="inline-flex items-center gap-2 bg-white text-teal-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100"
          >
            <Building2 className="w-5 h-5" /> Become a Partner
          </Link>
        </div>
      </section>
    </div>
  );
}
