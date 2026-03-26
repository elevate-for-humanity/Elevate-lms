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
  title: 'Community Events | Elevate for Humanity',
  description: 'Live workshops, webinars, networking events, and Q&A sessions with the Elevate community.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/community/events' },
};

// Community events = workshops, webinars, community type
const COMMUNITY_TYPES = ['workshop', 'webinar', 'community', 'networking', 'info_session'];

export default async function CommunityEventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents({ types: COMMUNITY_TYPES, limit: 12 }),
    getPastEvents({ types: COMMUNITY_TYPES, limit: 4 }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <Image
          src="/images/pages/community-page-1.jpg"
          alt="Elevate community events and workshops"
          fill className="object-cover" priority
        />
        
        <div className="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-300 mb-1">Community</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Events &amp; Workshops</h1>
          <p className="text-slate-300 mt-1 text-sm max-w-xl">
            Live sessions, webinars, and networking events open to learners, alumni, and community members.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Community', href: '/community' },
          { label: 'Events' },
        ]} />
      </div>

      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Upcoming</h2>
          <Link href="/events" className="text-sm text-brand-blue-600 hover:underline">View all events →</Link>
        </div>
        {upcoming.length === 0 ? (
          <EventsEmptyState
            message="No community events scheduled right now. Check the main events page or contact us."
            ctaLabel="All events" ctaHref="/events"
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
          <h2 className="text-xl font-bold text-white">Suggest a topic or host a session</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-lg mx-auto">
            Have an idea for a workshop or want to share your expertise with the community?
          </p>
          <Link href="/contact" className="mt-5 inline-block bg-white text-slate-900 px-8 py-3 rounded-lg font-semibold text-sm hover:bg-white transition-colors">
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
