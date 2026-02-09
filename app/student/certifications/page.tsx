import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Award, BarChart3, BookOpen, Clock } from 'lucide-react';
import { CertificationTracker } from '@/components/lms/CertificationTracker';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Certifications | Elevate LMS',
  description: 'Track your certification progress and submit completed certifications for review.',
};

export const dynamic = 'force-dynamic';

export default async function StudentCertificationsPage() {
  const supabase = await createClient();
  if (!supabase) { redirect('/login'); }
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/login?redirect=/student/certifications');
  }

  // Get user's enrolled programs
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      program_id,
      programs (id, name, slug)
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  const programs = enrollments?.map(e => e.programs).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs
        items={[
          { label: 'Student Portal', href: '/student' },
          { label: 'Certifications' },
        ]}
      />
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Elevate" width={36} height={36} className="rounded-lg" />
              <div className="hidden sm:block">
                <p className="font-bold text-slate-900">Elevate LMS</p>
                <p className="text-xs text-slate-500">Student Portal</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <Link href="/student/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <Link href="/lms/courses" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                <BookOpen className="w-4 h-4" />
                My Courses
              </Link>
              <Link href="/student/certifications" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600">
                <Award className="w-4 h-4" />
                Certifications
              </Link>
              <Link href="/student/hours" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
                <Clock className="w-4 h-4" />
                Hours Log
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link 
          href="/student/dashboard" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Certification Tracking</h1>
          <p className="text-slate-600">
            Track your progress on required certifications and submit completed certificates for verification.
          </p>
        </div>

        {/* Certification Trackers */}
        {programs.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">No Active Programs</h2>
            <p className="text-slate-600 mb-4">
              You&apos;re not currently enrolled in any programs with certification requirements.
            </p>
            <Link 
              href="/programs" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Programs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {programs.map((program: any) => (
              <CertificationTracker 
                key={program.id}
                programId={program.id}
                userId={user.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
