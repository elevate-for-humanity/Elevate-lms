import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { getUpcomingEvents, getPastEvents } from '@/lib/data/events';
import { createAdminClient } from '@/lib/supabase/admin';
import EventCard from '@/components/events/EventCard';
import EventsEmptyState from '@/components/events/EventsEmptyState';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Networking Events | Career Services | Elevate for Humanity',
  description: 'Connect with employers at career fairs, industry meetups, and networking events. Build relationships that lead to job opportunities.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/career-services/networking-events' },
};

const NETWORKING_TYPES = ['networking', 'career_fair'];

export default async function NetworkingEventsPage() {
  const db = createAdminClient();

  const [upcoming, past, employerCount, eventCount] = await Promise.all([
    getUpcomingEvents({ types: NETWORKING_TYPES, limit: 9 }),
    getPastEvents({ types: NETWORKING_TYPES, limit: 3 }),
    db ? db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer').then(r => r.count ?? 0) : Promise.resolve(0),
    db ? db.from('events').select('*', { count: 'exact', head: true }).in('event_type', NETWORKING_TYPES).eq('is_active', true).then(r => r.count ?? 0) : Promise.resolve(0),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <Image
          src="/images/pages/networking-hero.jpg"
          alt="Networking events and career fairs"
          fill className="object-cover" priority
         sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        
        <div className="absolute inset-x-0 bottom-0 max-w-6xl mx-auto px-4 pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-blue-300 mb-1">Career Services</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Networking Events</h1>
          <p className="text-black mt-1 text-sm max-w-xl">
            Career fairs, employer meetups, and industry networking events connecting Elevate graduates with hiring employers.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs items={[
          { label: 'Home', href: '/' },
          { label: 'Career Services', href: '/career-services' },
          { label: 'Networking Events' },
        ]} />
      </div>

      {/* Stats */}
      <div className="bg-white py-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-white">
            <span><strong className="text-brand-blue-400">{eventCount}</strong> Networking Events</span>
            <span><strong className="text-brand-blue-400">{employerCount}</strong> Employer Partners</span>
            <span><strong className="text-brand-green-400">Free</strong> for Elevate Graduates</span>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Upcoming Networking Events</h2>
          <Link href="/events" className="text-sm text-brand-blue-600 hover:underline">All events →</Link>
        </div>
        {upcoming.length === 0 ? (
          <EventsEmptyState
            message="No networking events scheduled right now. Register your interest and we'll notify you when the next event is announced."
            ctaLabel="Register interest" ctaHref="/contact"
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

      {/* Employer CTA */}
      <section className="border-t py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-14 h-14 bg-brand-blue-100 rounded-2xl flex items-center justify-center">
            <Building2 className="w-7 h-7 text-brand-blue-600" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900">Are you an employer?</h3>
            <p className="text-black text-sm mt-1">
              Participate in our career fairs and meet pre-screened, credential-ready candidates from Elevate programs.
            </p>
          </div>
          <Link href="/employer" className="flex-shrink-0 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-brand-blue-700 transition-colors">
            Partner with us
          </Link>
        </div>
      </section>
    </div>
  );
}
