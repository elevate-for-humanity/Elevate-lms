import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, FileText, CreditCard, Calendar, User, ArrowRight,
  Shield, Video, PenTool, Upload, CheckCircle2,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Student Onboarding | Elevate For Humanity',
  description: 'Complete your student onboarding to get started with your training program.',
};

export const dynamic = 'force-dynamic';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: any;
  required: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'orientation',
    title: 'Watch Orientation Video',
    description: 'Watch the full orientation video covering program structure, policies, rights, responsibilities, and support services',
    href: '/onboarding/learner/orientation',
    icon: Video,
    required: true,
  },
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your full name, date of birth, phone number, address, and emergency contact information',
    href: '/profile/edit',
    icon: User,
    required: true,
  },
  {
    id: 'identity',
    title: 'Verify Your Identity',
    description: 'Upload a photo of your government-issued ID (front and back) and a selfie for identity verification',
    href: '/onboarding/learner/verify-identity',
    icon: Shield,
    required: true,
  },
  {
    id: 'documents',
    title: 'Upload Required Documents',
    description: 'Submit your government-issued photo ID, Social Security card or proof of SSN, and proof of Indiana residency (utility bill, lease, or bank statement within 60 days)',
    href: '/onboarding/learner/documents',
    icon: Upload,
    required: true,
  },
  {
    id: 'agreements',
    title: 'Sign Required Agreements',
    description: 'Review and digitally sign your Enrollment Agreement, Participation Agreement, and FERPA Consent form using typed or drawn signature',
    href: '/onboarding/learner/agreements',
    icon: PenTool,
    required: true,
  },
  {
    id: 'handbook',
    title: 'Acknowledge Student Handbook',
    description: 'Read and acknowledge each section of the student handbook: attendance policy (80% minimum), dress code, code of conduct, safety protocols, and grievance procedures',
    href: '/onboarding/learner/handbook',
    icon: BookOpen,
    required: true,
  },
  {
    id: 'funding',
    title: 'Confirm Funding Source',
    description: 'Confirm your funding pathway — WIOA, Workforce Ready Grant, JRI, employer sponsorship, or self-pay with payment plan / BNPL options',
    href: '/funding/confirm',
    icon: CreditCard,
    required: true,
  },
  {
    id: 'schedule',
    title: 'Select Your Schedule',
    description: 'Choose your preferred cohort start date, class times, and confirm your availability for RTI sessions and OJT placement',
    href: '/schedule/select',
    icon: Calendar,
    required: true,
  },
];

export default async function LearnerOnboardingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/learner');

  // Fetch all data in parallel
  const [
    profileResult,
    enrollmentResult,
    docCountResult,
    agreementsResult,
    handbookResult,
    identityResult,
    orientationResult,
  ] = await Promise.all([
    db.from('profiles')
      .select('*, onboarding_completed, funding_confirmed, funding_source, orientation_completed, schedule_selected, enrollment_status, full_name, first_name, last_name, phone, date_of_birth, address')
      .eq('id', user.id)
      .single(),
    db.from('program_enrollments')
      .select('*, programs(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    db.from('documents')
      .select('document_type', { count: 'exact' })
      .eq('user_id', user.id),
    db.from('agreement_acceptances')
      .select('agreement_type')
      .eq('user_id', user.id),
    db.from('handbook_acknowledgments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1),
    db.from('id_verifications')
      .select('status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('orientation_completions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1),
  ]);

  const profile = profileResult.data;
  const enrollment = enrollmentResult.data;
  const docCount = docCountResult.count || 0;
  const signedAgreementTypes = new Set(
    (agreementsResult.data || []).map((a: any) => a.agreement_type),
  );
  const handbookAcknowledged = (handbookResult.data?.length || 0) > 0;
  const identityVerified = identityResult.data?.status === 'verified' || identityResult.data?.status === 'pending';
  const orientationDone = profile?.orientation_completed || (orientationResult.data?.length || 0) > 0;

  // Determine completed steps from real DB state
  const completedSteps: string[] = [];

  if (orientationDone) completedSteps.push('orientation');

  if (profile?.full_name && profile?.phone && profile?.date_of_birth) {
    completedSteps.push('profile');
  } else if (profile?.first_name && profile?.last_name && profile?.phone) {
    completedSteps.push('profile');
  }

  if (identityVerified) completedSteps.push('identity');
  if (docCount >= 3) completedSteps.push('documents');

  const requiredAgreements = ['enrollment', 'participation', 'ferpa'];
  if (requiredAgreements.every(a => signedAgreementTypes.has(a))) {
    completedSteps.push('agreements');
  }

  if (handbookAcknowledged) completedSteps.push('handbook');
  if (profile?.funding_confirmed) completedSteps.push('funding');
  if (profile?.schedule_selected) completedSteps.push('schedule');

  const progress = Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100);
  const allComplete = completedSteps.length === ONBOARDING_STEPS.length;

  if (allComplete && profile && !profile.onboarding_completed) {
    await db.from('profiles').update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    }).eq('id', user.id);
  }

  const isOnboardingComplete = allComplete || profile?.onboarding_completed;

  // Auto-enroll when all onboarding steps are complete
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const studentName = profile?.first_name || 'Student';
  const programName = enrollment?.programs?.name || 'your selected program';
  let justEnrolled = false;

  if (isOnboardingComplete && profile?.enrollment_status !== 'active') {
    const { data: application } = await db
      .from('applications')
      .select('id, program_interest, program_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (application) {
      let programId = application.program_id;
      if (!programId && application.program_interest) {
        const slug = application.program_interest.toLowerCase().replace(/\s+/g, '-').trim();
        const { data: programRow } = await db.from('programs').select('id').eq('slug', slug).maybeSingle();
        programId = programRow?.id || null;
      }

      await db.from('applications').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', application.id);
      const programSlug = application.program_interest?.toLowerCase().replace(/\s+/g, '-').trim() || '';

      if (programId) {
        await db.from('program_enrollments').upsert({
          user_id: user.id, program_id: programId, program_slug: programSlug, email: user.email,
          full_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          amount_paid_cents: 0, funding_source: 'pending', status: 'active', enrollment_state: 'enrolled',
        }, { onConflict: 'user_id,program_id', ignoreDuplicates: true });

        const { data: courses } = await db.from('training_courses').select('id').eq('program_id', programId).eq('is_active', true);
        if (courses && courses.length > 0) {
          await db.from('training_enrollments').upsert(
            courses.map((c: any) => ({ user_id: user.id, course_id: c.id, status: 'active', progress: 0, enrolled_at: new Date().toISOString() })),
            { onConflict: 'user_id,course_id', ignoreDuplicates: true },
          );
        }
      }

      await db.from('profiles').update({ enrollment_status: 'active' }).eq('id', user.id);
      justEnrolled = true;

      const logoUrl = `${siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;
      try {
        await sendEmail({
          to: user.email!,
          subject: `You're Enrolled! Welcome to ${programName} — Elevate for Humanity`,
          html: [
            `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">`,
            `<div style="text-align:center;padding:24px 0;border-bottom:2px solid #2563eb">`,
            `<img src="${logoUrl}" alt="Elevate for Humanity" width="180" style="max-width:180px;height:auto" />`,
            `</div><div style="padding:24px">`,
            `<h2>Hi ${studentName},</h2>`,
            `<p>Your onboarding is complete. You are now enrolled in <strong>${programName}</strong>.</p>`,
            `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0">`,
            `<p style="margin:0 0 8px;font-weight:bold">Your Login:</p>`,
            `<p style="margin:0">Email: <strong>${user.email}</strong></p>`,
            `<p style="margin:8px 0 0;font-size:13px;color:#64748b">Forgot your password? <a href="${siteUrl}/reset-password">Reset it here</a></p>`,
            `</div>`,
            `<p style="text-align:center"><a href="${siteUrl}/lms/dashboard" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Go to Student Portal</a></p>`,
            `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">`,
            `<div style="text-align:center;font-size:12px;color:#94a3b8">`,
            `<p style="margin:0 0 4px">Elevate for Humanity Career & Technical Institute</p>`,
            `<p style="margin:0 0 4px">8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</p>`,
            `<p style="margin:0"><a href="${siteUrl}" style="color:#2563eb">www.elevateforhumanity.org</a> | (317) 314-3757</p>`,
            `</div></div></div>`,
          ].join(''),
        });
      } catch (emailErr) {
        logger.warn('Failed to send enrollment email', emailErr as Error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Learner' }]} />
        </div>
      </div>

      <div className="bg-brand-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Welcome to Elevate for Humanity</h1>
          <p className="text-brand-blue-100 text-lg">
            {enrollment?.programs?.name
              ? `Complete your onboarding for ${enrollment.programs.name}`
              : 'Complete these steps to get started with your training'}
          </p>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Onboarding Progress</span>
              <span>{completedSteps.length} of {ONBOARDING_STEPS.length} steps — {progress}%</span>
            </div>
            <div className="h-3 bg-brand-blue-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {justEnrolled || profile?.enrollment_status === 'active' ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6 mb-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-brand-green-900 mb-2">You&apos;re Enrolled!</h2>
            <p className="text-brand-green-700 mb-4">
              Your onboarding is complete and you are enrolled in <strong>{programName}</strong>. Your courses are ready.
            </p>
            <Link href="/lms/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 font-semibold">
              Go to Student Portal <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8">
            <p className="text-brand-blue-800 font-medium">
              Complete all {ONBOARDING_STEPS.length} steps below. Once done, you will be automatically enrolled in your program.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {ONBOARDING_STEPS.map((step, index) => {
            const isComplete = completedSteps.includes(step.id);
            const Icon = step.icon;
            return (
              <div key={step.id} className={`bg-white rounded-lg border p-6 ${isComplete ? 'border-brand-green-200 bg-brand-green-50/30' : 'border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'bg-brand-green-100' : 'bg-gray-100'}`}>
                    {isComplete ? <CheckCircle2 className="w-5 h-5 text-brand-green-600" /> : <span className="text-gray-500 font-semibold">{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isComplete ? 'text-brand-green-900' : 'text-gray-900'}`}>{step.title}</h3>
                      {isComplete && <span className="text-xs bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded font-medium">Complete</span>}
                      {step.required && !isComplete && <span className="text-xs bg-brand-red-100 text-brand-red-700 px-2 py-0.5 rounded">Required</span>}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                    <Link href={step.href} className={`inline-flex items-center gap-2 font-medium text-sm ${isComplete ? 'text-brand-green-600 hover:text-brand-green-800' : 'text-brand-blue-600 hover:text-brand-blue-800'}`}>
                      <Icon className="w-4 h-4" />
                      {isComplete ? 'Review' : 'Complete this step'}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4 text-sm">Monday–Friday, 9 AM – 5 PM EST. Call (317) 314-3757.</p>
          <div className="flex justify-center gap-4">
            <Link href="/support" className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Help Center</Link>
            <Link href="/contact" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-medium">Contact Support</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
