import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/training',
  },
  title: 'Program Holder Training | Elevate For Humanity',
  description: 'Manage training sessions, instructor assignments, and curriculum delivery for your programs or need assistance.',
};

export default async function TrainingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Training" }]} />
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

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Training" }]} />
        </div>
      {/* Header */}
      <section className="bg-brand-blue-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Program Holder Training & Resources
          </h1>
          <p className="text-xl text-brand-blue-100">
            Watch our orientation video and access training materials to get
            started
          </p>
        </div>
      </section>

      {/* Orientation Video */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-black mb-4">
                Program Holder Orientation Video
              </h2>
              <p className="text-lg text-black mb-6">
                Watch this comprehensive orientation to understand your role,
                responsibilities, and how to use the platform effectively.
              </p>

              {/* Video Player */}
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full"
                  poster="/images/pages/program-holder-page-1.jpg"
                >
                  <source
                    src="/videos/training-providers-video-with-narration.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="mt-6 p-4 bg-brand-blue-50 rounded-lg border border-brand-blue-200">
                <p className="text-sm text-brand-blue-900">
                  <strong>Duration:</strong> ~5 minutes |
                  <strong className="ml-4">Topics Covered:</strong> Platform
                  navigation, student enrollment, progress tracking, compliance
                  reporting, and support resources
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training Modules */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-black mb-8">
            Training Modules
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Module 1 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-blue-700">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Getting Started</h3>
              <p className="text-black mb-4">
                Learn how to set up your account, complete verification, and
                navigate the dashboard.
              </p>
              <Link
                href="/program-holder/onboarding"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                View Guide →
              </Link>
            </div>

            {/* Module 2 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-green-700">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Student Management</h3>
              <p className="text-black mb-4">
                Enroll students, track progress, and manage your student roster
                effectively.
              </p>
              <Link
                href="/program-holder/students"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                Manage Students →
              </Link>
            </div>

            {/* Module 3 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-blue-700">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Compliance & Reporting</h3>
              <p className="text-black mb-4">
                Understand reporting requirements and maintain compliance with
                program standards.
              </p>
              <Link
                href="/program-holder/compliance"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                View Compliance →
              </Link>
            </div>

            {/* Module 4 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-orange-700">4</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Document Management</h3>
              <p className="text-black mb-4">
                Upload and manage required documents, licenses, and
                certifications.
              </p>
              <Link
                href="/program-holder/documents"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                Manage Documents →
              </Link>
            </div>

            {/* Module 5 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-brand-red-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-brand-red-700">5</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Support & Resources</h3>
              <p className="text-black mb-4">
                Access help documentation, contact support, and find answers to
                common questions.
              </p>
              <Link
                href="/program-holder/support"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                Get Support →
              </Link>
            </div>

            {/* Module 6 */}
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-teal-700">6</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Best Practices</h3>
              <p className="text-black mb-4">
                Learn proven strategies for student success and program
                excellence.
              </p>
              <Link
                href="/program-holder/handbook"
                className="text-brand-blue-700 font-semibold hover:underline"
              >
                Read Handbook →
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
              Need Help?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Contact support if you have questions about managing your
              programs or need assistance.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/support"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-white text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/program-holder/dashboard"
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
