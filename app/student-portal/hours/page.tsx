
import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import HoursTracker from './HoursTracker';

export const metadata: Metadata = {
  title: 'Hours & Progress | Student Portal | Elevate For Humanity',
  description: 'Track your verified and pending hours, view progress toward program completion.',
};

export default function HoursPage() {

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/pages/student-portal-page-6.jpg" alt="Student portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs 
          items={[
            { label: 'Student Portal', href: '/student-portal' },
            { label: 'Hours & Progress' }
          ]} 
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hours & Progress</h1>
        <p className="text-gray-600 mb-8">
          Track your verified hours and progress toward program completion.
        </p>

        <HoursTracker />
      </div>
    </div>
  );
}
