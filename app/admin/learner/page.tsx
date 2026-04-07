import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/learner',
  },
  title: 'Learner Management | Elevate For Humanity',
  description:
    'Manage individual learner profiles, progress tracking, and performance analytics.',
};

export default async function LearnerPage() {
  const supabase = await createClient();



  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Learner" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-learner-detail.jpg"
          alt="Learner Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">
                Individual Learner View
              </h2>
              <p className="text-black mb-6">
                Select a specific learner ID to view detailed information
              </p>
              <Link
                href="/admin/students"
                className="inline-block bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Browse All Learners
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Learner Management
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              View student profiles, progress, and enrollment history.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/students"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                View Students
              </Link>
              <Link
                href="/admin/reports"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
