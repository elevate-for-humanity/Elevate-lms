import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/training',
  },
  title: 'Program Holder Training | Elevate For Humanity',
  description: 'Manage training sessions, instructor assignments, and curriculum delivery for your programs or need assistance.',
};

export default async function TrainingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !['program_holder', 'admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/program-holder/dashboard');
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
      <section className="py-16">
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
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full"
                  poster="/images/pages/program-holder-page-1.jpg"
                  preload="metadata"
                >
                  <source
                    src="/videos/program-holder-orientation.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>

              <div className="mt-6 p-4 bg-brand-blue-50 rounded-lg border border-brand-blue-200">
                <p className="text-sm text-brand-blue-900">
                  <strong>Duration:</strong> ~7 minutes ·
                  <strong className="ml-2">Topics:</strong> What Elevate is · The LMS platform · The handbook · WorkOne registration · How you get paid · All 11 funded programs · Your rights · Next steps
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
            {[
              { num: 1, color: 'brand-blue', title: 'Getting Started', desc: 'Set up your account, complete verification, and navigate your dashboard.', href: '/program-holder/onboarding/setup', label: 'View Guide' },
              { num: 2, color: 'brand-blue', title: 'Student Management', desc: 'View enrolled students, track progress, and manage your roster.', href: '/program-holder/students', label: 'Manage Students' },
              { num: 3, color: 'brand-blue', title: 'Compliance & Reporting', desc: 'Attendance reporting, WIOA compliance, and audit requirements.', href: '/program-holder/compliance', label: 'View Compliance' },
              { num: 4, color: 'brand-orange', title: 'Document Management', desc: 'Upload and manage required licenses, insurance, and certifications.', href: '/program-holder/documents', label: 'Manage Documents' },
              { num: 5, color: 'brand-blue', title: 'Support & Resources', desc: 'Contact your Elevate coordinator and access help resources.', href: '/program-holder/support', label: 'Get Support' },
              { num: 6, color: 'brand-blue', title: 'Handbook & Rights', desc: 'Required reading — your responsibilities, rights, and exit terms.', href: '/program-holder/handbook', label: 'Read Handbook' },
            ].map(({ num, color, title, desc, href, label }) => (
              <div key={num} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition">
                <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <span className={`text-2xl font-bold text-${color}-700`}>{num}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-600 mb-4">{desc}</p>
                <Link href={href} className="text-brand-blue-700 font-semibold hover:underline">
                  {label} →
                </Link>
              </div>
            ))}
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
              Contact your Elevate coordinator or reach us directly at (317) 314-3757.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/program-holder/support"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 text-lg"
              >
                Contact Support
              </Link>
              <Link
                href="/program-holder/dashboard"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
