import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getUpcomingEvents, getPastEvents } from '@/lib/data/events';
import EventCard from '@/components/events/EventCard';
import EventsEmptyState from '@/components/events/EventsEmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-static'
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Events | Rise Foundation',
  description: 'Community fundraisers, volunteer events, and programs from the Rise Foundation at Elevate for Humanity.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/rise-foundation/events' },
};

const RISE_TYPES = ['fundraiser', 'community', 'orientation', 'graduation'];

export default async function RiseFoundationEventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ types: RISE_TYPES, limit: 9 }),
    getPastEvents({ types: RISE_TYPES, limit: 3 }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <Image
          src="/images/pages/success-hero.jpg"
          alt="Rise Foundation community events"
          fill className="object-cover" priority
        />
        
        <div className="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-orange-300 mb-1">Rise Foundation</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Events &amp; Programs</h1>
          <p className="text-slate-300 mt-1 text-sm max-w-xl">
            Fundraisers, community gatherings, graduations, and programs supporting workforce development in Indianapolis.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Rise Foundation', href: '/rise-foundation' },
          { label: 'Events' },
        ]} />
      </div>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Upcoming Events</h2>
          <Link href="/events" className="text-sm text-brand-blue-600 hover:underline">All events →</Link>
        </div>
        {upcoming.length === 0 ? (
          <EventsEmptyState
            message="No Rise Foundation events scheduled right now. Contact us to learn about upcoming programs."
            ctaLabel="Contact us" ctaHref="/contact"
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

      <section className="py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-white">Support the Rise Foundation</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-lg mx-auto">
            Your donation funds scholarships, tools, and wraparound services for workforce training participants.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-5">
            <Link href="/rise-foundation/donate" className="bg-brand-orange-500 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-brand-orange-600 transition-colors">Donate</Link>
            <Link href="/contact" className="border border-slate-500 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:border-white transition-colors">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
