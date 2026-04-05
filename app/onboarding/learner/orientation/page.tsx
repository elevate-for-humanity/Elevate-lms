import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CanonicalVideo from '@/components/video/CanonicalVideo';
import { BookOpen, CheckCircle2, ArrowLeft, Shield, Clock, Users, AlertTriangle } from 'lucide-react';
import OrientationAvatar from './OrientationAvatar';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Orientation | Elevate for Humanity',
  robots: { index: false, follow: false },
};

async function completeOrientation() {
  'use server';
  const { createClient } = await import('@/lib/supabase/server');
  const { logger } = await import('@/lib/logger');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date().toISOString();

  await Promise.all([
    // Mark profile flag (read by onboarding page completion check)
    supabase.from('profiles').update({
      orientation_completed: true,
      orientation_completed_at: now,
    }).eq('id', user.id),
    // Write to orientation_completions table (also read by onboarding page)
    supabase.from('orientation_completions').upsert({
      user_id: user.id,
      completed_at: now,
      orientation_type: 'learner',
    }, { onConflict: 'user_id', ignoreDuplicates: true }),
    // Write to onboarding_progress (canonical step tracker)
    supabase.from('onboarding_progress').upsert({
      user_id: user.id,
      step: 'orientation',
      completed: true,
      completed_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,step' }),
  ]);

  // Send "you're ready to start" email — non-blocking
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, full_name')
      .eq('id', user.id)
      .single();

    if (profile?.email) {
      const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'there';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
      await fetch(`${siteUrl}/api/email/send`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.CRON_SECRET ?? '',
      },
        body: JSON.stringify({
          to: profile.email,
          subject: 'Orientation complete — your course is ready',
          html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1e293b">
  <div style="background:#1e293b;padding:24px 32px">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Elevate for Humanity</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Career &amp; Technical Institute</p>
  </div>
  <div style="padding:32px">
    <h1 style="margin:0 0 16px;font-size:22px">You're ready to start, ${firstName}!</h1>
    <p style="color:#475569;line-height:1.6;margin:0 0 16px">
      You've completed orientation. Your coursework is now unlocked and waiting for you.
    </p>
    <p style="color:#475569;line-height:1.6;margin:0 0 24px">
      Log in to your learner dashboard to begin your first lesson. Work at your own pace —
      your progress is saved automatically.
    </p>
    <a href="${siteUrl}/learner/dashboard"
       style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:15px">
      Go to My Dashboard →
    </a>
    <p style="margin:32px 0 0;color:#94a3b8;font-size:12px">
      Questions? Call <strong>(317) 314-3757</strong> or reply to this email.<br>
      Elevate for Humanity Career &amp; Technical Institute
    </p>
  </div>
</div>`,
        }),
      });
    }
  } catch (emailErr) {
    logger.error('[orientation] Post-orientation email failed', emailErr);
  }

  redirect('/onboarding/learner/complete');
}

// Per-program credential and duration data from INTraining
const PROGRAM_META: Record<string, { duration: string; hours: string; credentials: string[]; hasOJT: boolean }> = {
  'hvac-technician':          { duration: '12 weeks', hours: '240 hours', credentials: ['EPA 608 Universal', 'OSHA 30', 'CPR', 'Rise Up Certificate', 'Residential HVAC Cert 1 & 2'], hasOJT: true },
  'barber-apprenticeship':    { duration: '15 months', hours: '2,000 hours', credentials: ['Indiana Registered Barber License', 'Rise Up Certificate'], hasOJT: true },
  'beauty-educator':          { duration: '84 days', hours: '336 hours', credentials: ['CPR', 'OSHA 10', 'Rise Up Certificate'], hasOJT: false },
  'bookkeeping':              { duration: '8 weeks', hours: '80 hours', credentials: ['QuickBooks Certified User', 'Microsoft Office Specialist Associate'], hasOJT: false },
  'business-management':      { duration: '5 weeks', hours: '50 hours', credentials: ['Business of Retail Certified Specialist', 'Certified Business Professional'], hasOJT: false },
  'cpr-aed':                  { duration: '1 day', hours: '8 hours', credentials: ['CPR/AED Certification'], hasOJT: false },
  'emergency-health':         { duration: '4 weeks', hours: '80 hours', credentials: ['CPR', 'Emergency Medical Responder (EMR)', 'OSHA 10'], hasOJT: false },
  'home-health-aide':         { duration: '4 weeks', hours: '80 hours', credentials: ['Home Health Aide (HHA) License', 'CCHW', 'CPR', 'Rise Up Certificate'], hasOJT: true },
  'medical-assistant':        { duration: '21 days', hours: '168 hours', credentials: ['CCHW', 'CPR', 'Rise Up Certificate'], hasOJT: false },
  'esthetician':              { duration: '5 weeks', hours: '100 hours', credentials: ['OSHA 10', 'Business of Retail Certified Specialist'], hasOJT: false },
  'reentry-specialist':       { duration: '45 days', hours: '360 hours', credentials: ['CPRC', 'CPSP', 'CCHW', 'CPR', 'Rise Up Certificate'], hasOJT: false },
  'pharmacy-technician':      { duration: '10 weeks', hours: '120 hours', credentials: ['PTCB CPhT'], hasOJT: false },
  'cna':                      { duration: '6 weeks', hours: '120 hours', credentials: ['Indiana CNA License', 'CPR'], hasOJT: true },
  'cdl':                      { duration: '4 weeks', hours: '160 hours', credentials: ['CDL Class A License'], hasOJT: true },
};

export default async function OrientationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Pull from program_enrollments first, fall back to training_enrollments (legacy HVAC)
  const [{ data: enrollment }, { data: legacyEnrollment }] = await Promise.all([
    supabase
      .from('program_enrollments')
      .select('program_id, programs ( title, slug, duration_weeks, description )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('training_enrollments')
      .select('training_courses ( course_name, slug, duration_hours )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const program = enrollment?.programs as { title: string; slug: string; duration_weeks: number; description: string } | null;

  // Legacy fallback — training_enrollments (HVAC and older courses)
  const legacyCourse = legacyEnrollment?.training_courses as { course_name: string; slug: string; duration_hours: number } | null;

  const slug = program?.slug ?? legacyCourse?.slug ?? '';
  const meta = PROGRAM_META[slug];

  const programTitle = program?.title ?? legacyCourse?.course_name ?? 'Your Program';
  const duration = meta?.duration ?? (program?.duration_weeks ? `${program.duration_weeks} weeks` : 'your program duration');
  const hours = meta?.hours ?? (legacyCourse?.duration_hours ? `${legacyCourse.duration_hours} hours` : '');
  const credentials = meta?.credentials ?? [];
  const hasOJT = meta?.hasOJT ?? false;

  const overviewItems = [
    `Your program is ${duration}${hours ? ` (${hours})` : ''} combining online coursework${hasOJT ? ' and hands-on training' : ''}.`,
    'Related Technical Instruction (RTI) is delivered through the Elevate LMS.',
    ...(hasOJT ? ['On-the-Job Training (OJT) is completed at employer partner sites.'] : []),
    credentials.length > 0
      ? `You will prepare for and earn the following credentials: ${credentials.join(', ')}.`
      : 'You will prepare for and sit for industry-recognized credential exams administered through their respective certifying organizations.',
  ];

  const sections = [
    { title: `Program Overview — ${programTitle}`, icon: BookOpen, items: overviewItems },
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
    <div className="min-h-screen bg-white">

      {/* VIDEO HERO — students learning, full bleed */}
      <div className="relative w-full overflow-hidden" style={{ height: '55vh', minHeight: 280, maxHeight: 480 }}>
        <CanonicalVideo
          src="/videos/getting-started-hero.mp4"
          poster="/images/pages/orientation-page-1.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding/learner' }, { label: 'Orientation' }]} />
        <Link href="/onboarding/learner" className="text-sm text-brand-blue-600 flex items-center gap-1 mt-4 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Onboarding</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Student Orientation</h1>
        <p className="text-sm text-gray-500 mb-6">Review the following information before starting your program. You must acknowledge each section to complete orientation.</p>

        <OrientationAvatar />

        <div className="space-y-4 mb-8">
          {sections.map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-center gap-2">
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
