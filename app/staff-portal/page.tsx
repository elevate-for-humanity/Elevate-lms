import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import PageAvatar from '@/components/PageAvatar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Staff Portal | Elevate For Humanity',
  description: 'Manage students, track enrollments, and access administrative tools.',
};

const features = [
  { title: 'Student Management', desc: 'View and manage student records and enrollments.', image: '/images/heroes/workforce-partner-2.jpg' },
  { title: 'Attendance', desc: 'Track and record student attendance.', image: '/images/hero-new/hero-8.jpg' },
  { title: 'Reports', desc: 'Generate and view performance reports.', image: '/images/business/tax-prep.jpg' },
  { title: 'Scheduling', desc: 'Manage class schedules and appointments.', image: '/images/healthcare/medical-assistant.jpg' },
  { title: 'Documents', desc: 'Access and manage important documents.', image: '/images/technology/hero-program-it-support.jpg' },
  { title: 'Settings', desc: 'Configure portal preferences and settings.', image: '/images/healthcare/hero-programs-healthcare.jpg' },
];

export default function StaffPortalLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal' }]} />
        </div>
      </div>

      {/* Hero with image */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/getting-started-hero.jpg" alt="Staff Portal" fill className="object-cover" priority quality={90} sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Staff Management Portal</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Manage students, track enrollments, monitor progress, and access administrative tools.</p>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}
      <PageAvatar 
        videoSrc="/videos/avatars/orientation-guide.mp4" 
        title="Staff Welcome" 
      />

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm border">
                <div className="relative h-32">
                  <Image src={feature.image} alt={feature.title} fill sizes="100vw" className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Access Your Portal</h2>
          <p className="text-lg text-slate-600 mb-8">Sign in to access staff tools or complete onboarding if you are new.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login?redirect=/staff-portal/dashboard" className="px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700">Sign In</Link>
            <Link href="/onboarding/staff" className="px-8 py-4 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200">Staff Onboarding</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
