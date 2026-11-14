import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, ChevronRight, Video, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Events & Workshops',
  description: 'Join Elevate for Humanity at upcoming career fairs, workforce events, and industry workshops throughout Indiana.',
};

const UPCOMING_EVENTS = [
  {
    id: 1,
    title: 'WorkOne Career Fair',
    date: 'August 15, 2026',
    time: '10:00 AM - 3:00 PM EST',
    location: 'WorkOne Northwest, Gary, IN',
    type: 'Career Fair',
    description: 'Connect with local employers and learn about training programs funded by WIOA.',
    registrationUrl: '/schedule/meeting',
  },
  {
    id: 2,
    title: 'Healthcare Career Workshop',
    date: 'August 22, 2026',
    time: '1:00 PM - 4:00 PM EST',
    location: 'Elevate Training Center, Indianapolis, IN',
    type: 'Workshop',
    description: 'Explore healthcare careers including Medical Assistant, Phlebotomy, and EKG technician programs.',
    registrationUrl: '/schedule/meeting',
  },
  {
    id: 3,
    title: 'HVAC Industry Panel',
    date: 'September 5, 2026',
    time: '6:00 PM - 8:00 PM EST',
    location: 'Virtual Event',
    type: 'Virtual',
    description: 'Hear from HVAC professionals about career opportunities and industry certifications.',
    registrationUrl: '/schedule/meeting',
  },
  {
    id: 4,
    title: 'Apprenticeship Information Session',
    date: 'September 12, 2026',
    time: '11:00 AM - 12:30 PM EST',
    location: 'WorkOne Center, Fort Wayne, IN',
    type: 'Info Session',
    description: 'Learn about DOL-registered apprenticeships in barber, cosmetology, and esthetics.',
    registrationUrl: '/schedule/meeting',
  },
];

const EVENT_TYPES = [
  { label: 'Career Fairs', count: 8, description: 'Connect with employers directly' },
  { label: 'Workshops', count: 12, description: 'Hands-on skill development' },
  { label: 'Info Sessions', count: 15, description: 'Learn about programs and funding' },
  { label: 'Virtual Events', count: 6, description: 'Attend from anywhere' },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events & Workshops</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Join us at career fairs, industry events, and workforce workshops throughout Indiana. 
            Build connections and advance your career.
          </p>
          <div className="mt-8">
            <Link href="/schedule/meeting" className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors">
              <Calendar className="w-5 h-5" />
              Schedule a Consultation
            </Link>
          </div>
        </div>
      </section>

      {/* Event Types */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Event Types</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {EVENT_TYPES.map((type) => (
              <div key={type.label} className="text-center p-6 bg-slate-50 rounded-xl">
                <div className="text-3xl font-bold text-brand-blue-600 mb-1">{type.count}</div>
                <div className="font-semibold text-slate-900">{type.label}</div>
                <div className="text-sm text-slate-600 mt-1">{type.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Upcoming Events</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {UPCOMING_EVENTS.map((event) => (
              <article key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 text-sm font-medium rounded-full">
                      {event.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{event.title}</h3>
                  <p className="text-slate-600 mb-4">{event.description}</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link href={event.registrationUrl} className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700">
                      Register Now <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events CTA */}
      <section className="py-16 bg-brand-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Missed an Event?</h2>
          <p className="text-blue-200 mb-8">
            Check out our recorded webinars and workshop materials in our resource library.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/webinars" className="inline-flex items-center justify-center gap-2 bg-white text-brand-blue-700 font-bold py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors">
              <Video className="w-5 h-5" />
              View Webinars
            </Link>
            <Link href="/resources" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold py-3 px-6 rounded-lg hover:bg-white/10 transition-colors">
              <ExternalLink className="w-5 h-5" />
              Browse Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Host an Event */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Host an Event</h2>
          <p className="text-slate-600 mb-8">
            Partner with us to host career fairs, hiring events, or training workshops at your location. 
            We provide resources, staff, and expertise.
          </p>
          <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700 transition-colors">
            <Users className="w-5 h-5" />
            Become an Event Partner
          </Link>
        </div>
      </section>
    </div>
  );
}
