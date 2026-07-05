import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, ExternalLink, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Events & Workshops',
  description:
    'Join us for information sessions, hiring events, workshops, and open houses. Free career training events in Indianapolis.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/events',
  },
};

const eventTypeColors = {
  'Info Session': 'bg-blue-100 text-blue-700',
  'Hiring Event': 'bg-brand-green-100 text-brand-green-700',
  'Program Orientation': 'bg-purple-100 text-purple-700',
  Workshop: 'bg-orange-100 text-orange-700',
  'Open House': 'bg-pink-100 text-pink-700',
  'Employer Event': 'bg-indigo-100 text-indigo-700',
  Graduation: 'bg-red-100 text-red-700',
};

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .order('date');
  const events = upcomingEvents || [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Events' }]} />
      </div>
      {/* Hero Section */}
      <section className="relative bg-white text-slate-900 py-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-semibold">Upcoming Events</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Events & Workshops</h1>
            <p className="text-base md:text-lg text-blue-100 leading-relaxed">
              Join us for free information sessions, hiring events, workshops, and open houses. All
              events are free and open to the community.
            </p>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">Upcoming Events</h2>
              <p className="text-lg text-black">
                All events are free. Registration recommended but not required for most events.
              </p>
            </div>

            <div className="space-y-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Date Box */}
                    <div className="flex-shrink-0">
                      <div className="bg-brand-blue-600 text-white rounded-lg p-4 text-center w-24">
                        <div className="text-3xl font-bold">{new Date(event.date).getDate()}</div>
                        <div className="text-sm uppercase">
                          {new Date(event.date).toLocaleDateString('en-US', {
                            month: 'short',
                          })}
                        </div>
                        <div className="text-xs">{new Date(event.date).getFullYear()}</div>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start gap-3 mb-3">
                        <h3 className="text-lg md:text-lg font-bold text-black flex-1">
                          {event.title}
                        </h3>
                        <span
                          className={`px-3 py-2 rounded-full text-sm font-semibold ${
                            eventTypeColors[event.type as keyof typeof eventTypeColors]
                          }`}
                        >
                          {event.type}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-black">
                          <Clock className="w-5 h-5 text-slate-400" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-start gap-2 text-black">
                          {event.virtual ? (
                            <Video className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-semibold">{event.location}</div>
                            {event.address !== 'Online' && (
                              <div className="text-sm">{event.address}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-black">
                          <Users className="w-5 h-5 text-slate-400" />
                          <span>{event.capacity}</span>
                        </div>
                      </div>

                      <p className="text-black mb-4 leading-relaxed">{event.description}</p>

                      <Link
                        href={event.registration}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition"
                      >
                        Register Now
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recurring Events */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Recurring Events</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">Monthly Info Sessions</h3>
                <p className="text-black mb-4">
                  Second Tuesday of every month, 6:00 PM - 7:30 PM. Learn about all our programs and
                  funding options.
                </p>
                <Link
                  href="/contact"
                  className="text-brand-blue-600 font-semibold hover:text-brand-blue-700"
                >
                  Register →
                </Link>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">Quarterly Hiring Events</h3>
                <p className="text-black mb-4">
                  Third Thursday of Jan, Apr, Jul, Oct. Meet 20+ employers hiring our graduates.
                </p>
                <Link
                  href="/employer/dashboard"
                  className="text-brand-blue-600 font-semibold hover:text-brand-blue-700"
                >
                  Learn More →
                </Link>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">Weekly Open Hours</h3>
                <p className="text-black mb-4">
                  Every Wednesday, 4:00 PM - 6:00 PM. Drop in for questions, tours, or to start your
                  application.
                </p>
                <Link
                  href="/contact"
                  className="text-brand-blue-600 font-semibold hover:text-brand-blue-700"
                >
                  Visit Us →
                </Link>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-2">Graduation Ceremonies</h3>
                <p className="text-black mb-4">
                  End of each quarter (Mar, Jun, Sep, Dec). Celebrate our graduates and their
                  achievements!
                </p>
                <Link
                  href="/success-stories"
                  className="text-brand-blue-600 font-semibold hover:text-brand-blue-700"
                >
                  Success Stories →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Can&apos;t Make an Event?</h2>
            <p className="text-base md:text-lg text-blue-100 mb-8">
              Contact us anytime to schedule a personal tour or phone consultation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-brand-blue-600 bg-white rounded-lg hover:bg-slate-50 transition shadow-lg"
              >
                Contact Us
              </Link>
              <Link
                href="/apply"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-slate-900 bg-white/10 backdrop-blur-sm border-2 border-white rounded-lg hover:bg-white/20 transition"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
