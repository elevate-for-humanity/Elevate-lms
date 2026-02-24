import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { BookOpen, CheckCircle2, ArrowLeft, Shield, Clock, Users, AlertTriangle, Video, GraduationCap } from 'lucide-react';
import OrientationAvatar from './OrientationAvatar';

export const metadata: Metadata = {
  title: 'Orientation | Elevate for Humanity',
  robots: { index: false, follow: false },
};

async function completeOrientation() {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) throw new Error('Database unavailable');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Record in profiles
  await db.from('profiles').update({
    orientation_completed: true,
    orientation_completed_at: new Date().toISOString(),
  }).eq('id', user.id);

  // Record in orientation_completions for audit trail
  await db.from('orientation_completions').upsert({
    user_id: user.id,
    completed_at: new Date().toISOString(),
    version: '2025.1',
  }, { onConflict: 'user_id', ignoreDuplicates: true });

  redirect('/onboarding/learner');
}

export default async function OrientationPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check if already completed
  const { data: profile } = await db.from('profiles').select('orientation_completed').eq('id', user.id).single();
  const alreadyDone = profile?.orientation_completed;

  const sections = [
    { title: 'About Elevate for Humanity', icon: GraduationCap, items: [
      'Elevate for Humanity is a workforce development training provider registered on Indiana\'s INTraining system under provider 2Exclusive LLC-S.',
      'Programs are approved by the Indiana Department of Workforce Development and the U.S. Department of Labor.',
      'We offer career training in healthcare, skilled trades, technology, barbering, business, and public safety.',
      'Every program leads to industry-recognized credentials issued by national certifying bodies.',
    ]},
    { title: 'Program Structure (RTI + OJT)', icon: BookOpen, items: [
      'Related Technical Instruction (RTI): Online coursework through the Elevate LMS — lessons, videos, quizzes, and assignments.',
      'On-the-Job Training (OJT): Hands-on training at employer partner sites with supervised practice.',
      'Program lengths vary: CPR/First Aid (1 day), HVAC Technician (20 weeks), Barber Apprenticeship (15 months).',
      'After onboarding, access your student dashboard at elevateforhumanity.org/lms/dashboard.',
      'Courses are organized into modules and lessons. Complete them in order. Minimum passing score: 70%.',
    ]},
    { title: 'Funding & Payment', icon: Shield, items: [
      'Most students pay nothing out of pocket through WIOA, Workforce Ready Grant, JRI, or registered apprenticeships.',
      'WIOA students must register at indianacareerconnect.com — this is required for eligibility.',
      'Self-pay options include payment plans and Buy Now, Pay Later (Klarna, Afterpay, Sezzle, Affirm, Zip).',
      'Your funding source is confirmed during onboarding. Contact your case manager with questions.',
    ]},
    { title: 'Attendance Policy', icon: Clock, items: [
      'Minimum 80% attendance rate required for both RTI and OJT sessions.',
      'Notify your instructor within 24 hours if you will be absent.',
      'Three unexcused absences may result in academic probation.',
      'Two consecutive unexcused absences trigger an intervention meeting.',
      'Make-up work must be completed within one week. Three late arrivals per month = one unexcused absence.',
      'If you face barriers (transportation, childcare, health), contact your case manager for supportive services.',
    ]},
    { title: 'Code of Conduct & Dress Code', icon: Users, items: [
      'Professional conduct required at all times — in class, online, and at employer sites.',
      'All work must be your own. Plagiarism or cheating results in disciplinary action.',
      'Professional attire required during clinical and practical sessions. Closed-toe shoes in all labs.',
      'Program-specific dress codes: scrubs (healthcare), steel-toe boots (trades), all-black (barber).',
      'Drug and alcohol free during all training. Some employers require drug screening and background checks.',
    ]},
    { title: 'Safety Protocols', icon: AlertTriangle, items: [
      'Report unsafe conditions to your instructor immediately. Know emergency exit locations.',
      'Wear all required PPE at all times in designated areas.',
      'Follow lockout/tagout procedures. Never operate equipment without authorization.',
      'Healthcare: Follow universal precautions and infection control. Report exposure incidents immediately.',
      'Report all injuries, no matter how minor, to your instructor immediately.',
    ]},
    { title: 'Your Rights (FERPA)', icon: Shield, items: [
      'Right to a safe, respectful learning environment free from discrimination and harassment.',
      'Right to access your educational records under FERPA (Family Educational Rights and Privacy Act).',
      'Right to reasonable accommodations for documented disabilities.',
      'Right to file a grievance without retaliation.',
      'Your records are private. We share progress with your funding source only with your signed FERPA consent.',
    ]},
    { title: 'Support Services & Career Placement', icon: Users, items: [
      'Career services: resume writing, interview prep, and connections to 50+ employer partners.',
      'Case management: transportation assistance, childcare referrals, work clothing, and other supportive services.',
      'Tutoring and additional instruction available upon request.',
      'Technical support: contact (317) 314-3757 or use the student portal.',
      'Many graduates receive job offers before completing their program.',
    ]},
    { title: 'Grievance Procedures', icon: BookOpen, items: [
      'Step 1: Talk to your instructor or advisor for informal resolution.',
      'Step 2: Submit written grievance at elevateforhumanity.org/support/grievance or email info@elevateforhumanity.org.',
      'Step 3: Program director reviews and responds within 5 business days.',
      'Step 4: Appeal to executive director if not satisfied. Decision is final.',
      'You will not face retaliation for filing a complaint. All records maintained for 3 years.',
    ]},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Orientation' }]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Onboarding
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Video className="w-7 h-7 text-brand-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Student Orientation</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Watch the orientation video and review all sections below. This covers everything you need to know
          about your program, policies, rights, and support services.
        </p>

        {alreadyDone && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6 mb-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-brand-green-900 mb-2">Orientation Complete</h2>
            <p className="text-brand-green-700 mb-4">You have completed orientation. Continue with your onboarding.</p>
            <Link href="/onboarding/learner" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green-600 text-white rounded-lg font-medium hover:bg-brand-green-700">
              Continue Onboarding <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}

        {/* Avatar Orientation Video */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Video className="w-5 h-5 text-brand-blue-600" />
            Orientation Video
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            Watch the full orientation video (~8–10 minutes). This covers program structure, funding, policies,
            your rights, and what to expect.
          </p>
          <OrientationAvatar />
        </div>

        {/* Written Sections */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Orientation Materials</h2>
        <div className="space-y-4 mb-8">
          {sections.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <s.icon className="w-4 h-4 text-brand-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">{s.title}</h3>
              </div>
              <ul className="p-5 space-y-2">
                {s.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Acknowledgment Form */}
        {!alreadyDone && (
          <form action={completeOrientation} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Orientation Acknowledgment</h3>
            <label className="flex items-start gap-3 cursor-pointer mb-3">
              <input type="checkbox" name="watched" required className="mt-1 w-5 h-5 text-brand-blue-600 border-gray-300 rounded" />
              <span className="text-sm text-gray-700">
                I have watched the orientation video in its entirety.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer mb-3">
              <input type="checkbox" name="read" required className="mt-1 w-5 h-5 text-brand-blue-600 border-gray-300 rounded" />
              <span className="text-sm text-gray-700">
                I have read and understand all orientation materials above, including attendance policy, code of conduct, safety protocols, my rights under FERPA, and the grievance procedures.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input type="checkbox" name="agree" required className="mt-1 w-5 h-5 text-brand-blue-600 border-gray-300 rounded" />
              <span className="text-sm text-gray-700">
                I agree to follow all program policies, attendance requirements, and safety protocols as described in this orientation.
              </span>
            </label>
            <div className="flex justify-end">
              <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700">
                <CheckCircle2 className="w-5 h-5" /> Complete Orientation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
