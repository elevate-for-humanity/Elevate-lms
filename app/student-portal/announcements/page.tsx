
import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import AnnouncementsList from './AnnouncementsList';

export const metadata: Metadata = {
  title: 'Announcements | Student Portal | Elevate For Humanity',
  description: 'View all announcements and updates for students.',
};

export default function AnnouncementsPage() {

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/success-hero.jpg" alt="Student portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs 
          items={[
            { label: 'Student Portal', href: '/student-portal' },
            { label: 'Announcements' }
          ]} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
        <p className="text-gray-600 mb-8">
          Stay updated with the latest news and important information.
        </p>

        <AnnouncementsList />
      </div>
    </div>
  );
}
