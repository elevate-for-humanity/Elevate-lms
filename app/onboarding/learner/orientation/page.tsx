import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BookOpen, CheckCircle2, ArrowLeft, Shield, Clock, Users, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Orientation | Elevate for Humanity',
  robots: { index: false, follow: false },
};

async function completeOrientation() {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await supabase.from('profiles').update({
    orientation_completed: true,
    orientation_completed_at: new Date().toISOString(),
  }).eq('id', user.id);

  redirect('/onboarding/learner');
}

export default async function OrientationPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sections = [
    { title: 'Program Overview', icon: BookOpen, items: [
      'Your program is 20 weeks (400+ hours) combining online coursework and hands-on training.',
      'Related Technical Instruction (RTI) is delivered through the Elevate LMS.',
      'On-the-Job Training (OJT) is completed at employer partner sites.',
      'You will earn industry-recognized credentials including EPA 608 and OSHA certifications.',
    ]},
    { title: 'Attendance & Expectations', icon: Clock, items: [
      'Attendance is tracked daily. Two consecutive unexcused absences trigger an intervention.',
      'You must complete all assigned coursework, quizzes, and assessments.',
      'Maintain professional conduct at all times — in class, online, and at employer sites.',
      'Communicate any schedule conflicts or issues to your instructor immediately.',
    ]},
    { title: 'Safety & Compliance', icon: Shield, items: [
      'OSHA safety training is mandatory before any hands-on work.',
      'Follow all safety protocols at employer sites. PPE is required where specified.',
      'Report any safety concerns to your instructor or site supervisor immediately.',
      'Drug screening and background checks may be required by employer partners.',
    ]},
    { title: 'Support Services', icon: Users, items: [
      'Career services are available throughout and after your program.',
      'Contact your case manager for supportive services (transportation, childcare, etc.).',
      'Tutoring and additional instruction are available upon request.',
      'Grievance procedures are documented in the student handbook.',
    ]},
    { title: 'Academic Integrity', icon: AlertTriangle, items: [
      'All work must be your own. Plagiarism or cheating results in disciplinary action.',
      'Certification exams are proctored. No unauthorized materials during exams.',
      'Quiz and assessment scores are tracked in the LMS.',
      'A minimum passing score of 70% is required on all assessments.',
    ]},
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Orientation' }]} />
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-4 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Onboarding</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Orientation</h1>
        <p className="text-sm text-gray-500 mb-6">Review the following information before starting your program. You must acknowledge each section to complete orientation.</p>

        <div className="space-y-4 mb-8">
          {sections.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <s.icon className="w-4 h-4 text-brand-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900">{s.title}</h2>
              </div>
              <ul className="p-5 space-y-2">
                {s.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <form action={completeOrientation} className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" required className="mt-1" />
            <span className="text-sm text-gray-700">
              I have read and understand the orientation materials above. I agree to follow all program policies, attendance requirements, and safety protocols.
            </span>
          </label>
          <div className="flex justify-end mt-6">
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <CheckCircle2 className="w-4 h-4" /> Complete Orientation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
