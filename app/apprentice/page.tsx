import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, Clock, FileText, Award, BookOpen, ArrowRight, Scissors } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getNextRequiredAction } from '@/lib/enrollment/gate';

export const metadata: Metadata = {
  title: 'Apprentice Portal | Elevate For Humanity',
  description: 'Track your apprenticeship progress, hours, and certifications.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apprentice',
  },
};

export const dynamic = 'force-dynamic';

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Get active enrollment with program info
  const { data: enrollment } = await supabase
    .from('training_enrollments')
    .select('*, programs(slug, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Gate: Redirect if orientation or documents not complete
  if (enrollment) {
    if (!enrollment.orientation_completed_at) {
      const programSlug = enrollment.programs?.slug || 'barber-apprenticeship';
      redirect(`/programs/${programSlug}/orientation`);
    }
    if (!enrollment.documents_submitted_at) {
      const programSlug = enrollment.programs?.slug || 'barber-apprenticeship';
      redirect(`/programs/${programSlug}/documents`);
    }
  }

  // Get next required action based on real enrollment state
  const nextAction = enrollment ? getNextRequiredAction({
    status: enrollment.status,
    orientation_completed_at: enrollment.orientation_completed_at,
    documents_submitted_at: enrollment.documents_submitted_at,
    program_slug: enrollment.programs?.slug,
  }) : { label: 'Apply to a Program', href: '/programs', description: 'Start your journey' };

  const { data: enrollments } = await supabase
    .from('training_enrollments')
    .select('id, status, progress, course_id')
    .eq('user_id', user.id)
    .limit(5);

  // Get real hours from attendance_hours table
  const { data: hoursData } = await supabase
    .from('attendance_hours')
    .select('hours_logged')
    .eq('enrollment_id', enrollment?.id);
  
  const totalHours = hoursData?.reduce((sum, h) => sum + (h.hours_logged || 0), 0) || 0;
  const requiredHours = 1500; // Barber requirement

  const quickLinks = [
    { name: 'Timeclock', href: '/apprentice/timeclock', icon: Clock, description: 'Clock in / out at your work site' },
    { name: 'Shift History', href: '/apprentice/timeclock/history', icon: Clock, description: 'View all recorded shifts' },
    { name: 'Log Hours', href: '/apprentice/hours/log', icon: Clock, description: 'Manually record OJL & RTI hours' },
    { name: 'Hours History', href: '/apprentice/hours', icon: Clock, description: 'Review submitted hour entries' },
    { name: 'Competency Log', href: '/apprentice/competencies/log', icon: Scissors, description: 'Log a service for WPS credit' },
    { name: 'Competency Progress', href: '/apprentice/competencies', icon: Scissors, description: 'Track cuts, shaves & WPS skills' },
    { name: 'Documents', href: '/apprentice/documents', icon: FileText, description: 'View required documents' },
    { name: 'Skills Checklist', href: '/apprentice/skills', icon: Award, description: 'Track skill competencies' },
    { name: 'Handbook', href: '/apprentice/handbook', icon: BookOpen, description: 'Apprenticeship guidelines' },
    { name: 'Transfer Hours', href: '/apprentice/transfer-hours', icon: ArrowRight, description: 'Request hour transfers' },
    { name: 'State Board', href: '/apprentice/state-board', icon: GraduationCap, description: 'Exam preparation' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apprentice Portal' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* NEXT REQUIRED ACTION - Always visible at top */}
        <div className="bg-brand-blue-700 text-white rounded-xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium uppercase tracking-wide mb-1">Next Required Action</p>
              <h2 className="text-2xl font-bold">{nextAction.label}</h2>
              <p className="text-white mt-1">{nextAction.description}</p>
            </div>
            <Link
              href={nextAction.href}
              className="bg-white text-brand-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-50 transition flex items-center gap-2"
            >
              Start Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {profile?.full_name || 'Apprentice'}
          </h1>
          <p className="text-gray-600 mt-2">
            Track your apprenticeship journey and progress
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hours Progress</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((totalHours / requiredHours) * 100, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-lg font-medium text-gray-900">
              {totalHours.toLocaleString()} / {requiredHours.toLocaleString()} hours
            </span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <link.icon className="w-8 h-8 text-brand-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">{link.name}</h3>
              <p className="text-sm text-gray-600">{link.description}</p>
            </Link>
          ))}
        </div>

        {/* Active Enrollments */}
        {enrollments && enrollments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Programs</h2>
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Program #{enrollment.course_id}</p>
                    <p className="text-sm text-gray-600">Status: {enrollment.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-brand-blue-600">{enrollment.progress || 0}%</p>
                    <p className="text-sm text-gray-600">Complete</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
