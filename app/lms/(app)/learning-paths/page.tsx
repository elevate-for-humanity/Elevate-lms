import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { BookOpen, Award, Briefcase } from 'lucide-react';
import { unstable_cache } from 'next/cache';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/lms/learning-paths',
  },
  title: 'Learning Paths | Elevate For Humanity',
  description:
    'Explore structured learning paths for career development.',
};

export const dynamic = 'force-dynamic';

// Cache user data for 60 seconds to reduce DB load
const getCachedUserData = unstable_cache(
  async (userId: string, supabase: any) => {
    // Run queries in parallel instead of sequentially
    const [profileResult, enrollmentsResult, activeResult, completedResult, progressResult] = await Promise.all([
      db
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('id', userId)
        .single(),
      db
        .from('program_enrollments')
        .select(`
          id, status, progress, created_at,
          courses (id, title, description, thumbnail_url)
        `)
        .eq('user_id', userId)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })
        .limit(10),
      db
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')
        .is('revoked_at', null),
      db
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .is('revoked_at', null),
      db
        .from('student_progress')
        .select(`id, updated_at, courses (title)`)
        .eq('student_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5),
    ]);

    return {
      profile: profileResult.data,
      enrollments: enrollmentsResult.data,
      activeCourses: activeResult.count,
      completedCourses: completedResult.count,
      recentProgress: progressResult.data,
    };
  },
  ['learning-paths-user-data'],
  { revalidate: 60, tags: ['learning-paths'] }
);

export default async function LearningPathsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Learning Paths" }]} />
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

  // Use cached parallel queries instead of sequential
  const { profile, enrollments, activeCourses, completedCourses, recentProgress } = 
    await getCachedUserData(user.id, supabase);

  return (
    <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/courses" }, { label: "Learning Paths" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/lms-page-4.jpg"
          alt="Learning Paths"
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
            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-6">Learning Paths</h2>
                <p className="text-black mb-6">
                  Explore structured learning paths for career development.
                  workforce training and career success.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Free training for eligible participants</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Industry-standard certifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>Career support and job placement</span>
                  </li>
                </ul>
              </div>
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/pages/lms-page-4.jpg"
                  alt="Learning Paths"
                  fill
                  className="object-cover"
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <BookOpen className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Learn</h3>
                <p className="text-black">Access quality training programs</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Award className="w-8 h-8 text-brand-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Certify</h3>
                <p className="text-black">Earn industry certifications</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Briefcase className="w-8 h-8 text-brand-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-3">Work</h3>
                <p className="text-black">Get hired in your field</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need Help?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Contact support if you have questions about the learning
              platform or need assistance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/support"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/lms/dashboard"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
