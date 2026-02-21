import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Instructor Portal | Elevate For Humanity',
  description: 'Manage courses, track student progress, and access teaching tools.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/instructor',
  },
};

export default function InstructorPortalLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Instructor Portal' }]} />
        </div>
      </div>

      {/* Hero with Image */}
      {/* Hero */}
      <section className="relative w-full">
        <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
          <Image src="/images/hero-new/hero-7.jpg" alt="Instructor Portal" fill className="object-cover" priority sizes="100vw" />
        </div>
        <div className="bg-slate-900 py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Instructor Portal</h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">Manage your courses, track student progress, grade assignments, and communicate with learners.</p>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Portal Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/trades/program-building-construction.jpg" alt="Course Management" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Course Management</h3>
                <p className="text-slate-600">Create and manage your course content and materials.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/heroes/training-provider-5.jpg" alt="Student Roster" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Student Roster</h3>
                <p className="text-slate-600">View enrolled students and their information.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/career-coaching-new.jpg" alt="Progress Tracking" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Progress Tracking</h3>
                <p className="text-slate-600">Monitor student progress and completion rates.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/gallery/image3.jpg" alt="Grading" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Grading</h3>
                <p className="text-slate-600">Grade assignments and provide feedback.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/hero/portal-hero.jpg" alt="Communication" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Communication</h3>
                <p className="text-slate-600">Message students and make announcements.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border">
              <div className="relative h-32">
                <Image src="/images/heroes/training-provider-5.jpg" alt="Certifications" fill sizes="100vw" className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Certifications</h3>
                <p className="text-slate-600">Issue certificates to completing students.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Start Teaching</h2>
          <p className="text-lg text-slate-600 mb-8">Already an instructor? Sign in. Want to teach? Apply today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/login?redirect=/instructor/dashboard" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Sign In</Link>
            <Link href="/apply?role=instructor" className="px-8 py-4 bg-slate-100 text-slate-900 font-bold rounded-lg hover:bg-slate-200">Become an Instructor</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
