import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Learner" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Learner" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[280px] md:h-[350px] lg:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/student-career.jpg"
          alt="Learner Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Learner Management
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Manage individual learner profiles, progress tracking, and
            performance analytics
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/students"
              className="bg-brand-green-600 hover:bg-brand-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View All Students
            </Link>
            <Link
              href="/admin/reports"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
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
      <section className="py-16 bg-brand-blue-700 text-white">
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
