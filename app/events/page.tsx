import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getUpcomingEvents, getPastEvents } from '@/lib/data/events';
import EventCard from '@/components/events/EventCard';
import EventsEmptyState from '@/components/events/EventsEmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Events | Elevate for Humanity',
  description: 'Upcoming workshops, info sessions, career fairs, and community events in Indianapolis and online.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/events' },
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ limit: 12 }),
    getPastEvents({ limit: 6 }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <Image
          src="/images/pages/events-page-1.jpg"
          alt="Elevate for Humanity community events"
          fill className="object-cover" priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-300 mb-1">Elevate for Humanity</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Events</h1>
          <p className="text-slate-300 mt-1 text-sm max-w-xl">
            Workshops, info sessions, career fairs, and community gatherings in Indianapolis and online.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Events' }]} />
      </div>

      {/* Upcoming */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Upcoming Events</h2>
          <span className="text-sm text-slate-500">{upcoming.length} scheduled</span>
        </div>
        {upcoming.length === 0 ? (
          <EventsEmptyState
            message="No upcoming events right now. Contact us to be notified when new events are added."
            ctaLabel="Get notified" ctaHref="/contact"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-12">
          <h2 className="text-lg font-bold text-slate-700 mb-4">Past Events</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>
      )}

      <section className="bg-slate-900 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white">Want to host or sponsor an event?</h2>
          <p className="text-slate-400 mt-2 max-w-xl mx-auto text-sm">
            Partner with Elevate for Humanity to connect with workforce-ready talent and the Indianapolis community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
            <Link href="/contact" className="bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors">Contact Us</Link>
            <Link href="/for/employers" className="border border-slate-500 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:border-white transition-colors">Employer Partnerships</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
