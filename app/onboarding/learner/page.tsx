import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, FileText, CreditCard, Calendar, User, ArrowRight, Phone, Mail, HelpCircle, ClipboardCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CanonicalVideo from '@/components/video/CanonicalVideo';
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
  image: string;
  imageAlt: string;
  required: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your contact information so we can support you throughout the program.',
    href: '/profile/edit',
    icon: User,
    image: '/images/pages/career-services-page-2.jpg',
    imageAlt: 'Student completing profile at Elevate for Humanity',
    required: true,
  },
  {
    id: 'documents',
    title: 'Upload Required Documents',
    description: 'Submit your government-issued ID, proof of Indiana residency, and proof of income (if applying for WIOA funding).',
    href: '/onboarding/learner/documents',
    icon: FileText,
    image: '/images/pages/career-services-page-2.jpg',
    imageAlt: 'Document submission process',
    required: true,
  },
  {
    id: 'funding',
    title: 'Confirm Funding Source',
    description: 'Review and confirm how your training will be funded — WIOA, Workforce Ready Grant, employer sponsorship, or self-pay.',
    href: '/funding/confirm',
    icon: CreditCard,
    image: '/images/pages/career-services-page-2.jpg',
    imageAlt: 'Funding and financial aid options',
    required: true,
  },
  {
    id: 'schedule',
    title: 'Select Your Schedule',
    description: 'Choose your cohort start date and class schedule. Day and evening options available.',
    href: '/schedule/select',
    icon: Calendar,
    image: '/images/pages/career-services-page-2.jpg',
    imageAlt: 'Training classroom schedule selection',
    required: true,
  },
  {
    id: 'agreements',
    title: 'Sign Enrollment Agreement',
    description: 'Review and sign your enrollment agreement covering program terms, attendance policy, and your rights as a student.',
    href: '/onboarding/learner/agreements',
    icon: ClipboardCheck,
    image: '/images/pages/career-services-page-2.jpg',
    imageAlt: 'Signing enrollment agreement',
    required: true,
  },
  {
    id: 'handbook',
    title: 'Acknowledge Student Handbook',
    description: 'Read and acknowledge the student handbook covering attendance, dress code, conduct, and grievance procedures.',
    href: '/onboarding/learner/handbook',
    icon: BookOpen,
    image: '/images/pages/career-services-page-2.jpg',
    imageAlt: 'Student handbook',
    required: true,
  },
  {
    id: 'orientation',
    title: 'Complete Orientation',
    description: 'Review program policies and complete your orientation to get ready for your first day.',
    href: '/onboarding/learner/orientation',
    icon: BookOpen,
    image: '/images/pages/career-services-page-2.jpg',
    imageAlt: 'Students in orientation session',
    required: true,
  },
];

export default async function LearnerOnboardingPage() {
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/onboarding/learner');
  }

  // Fetch all data in parallel
  const [
    profileResult,
    enrollmentResult,
    docCountResult,
    agreementsResult,
    handbookResult,
    idDocResult,
    orientationResult,
  ] = await Promise.all([
    supabase.from('profiles')
      .select('*, onboarding_completed, funding_confirmed, funding_source, orientation_completed, schedule_selected, enrollment_status, full_name, first_name, last_name, phone, address')
      .eq('id', user.id)
      .single(),
    supabase.from('program_enrollments')
      .select('id, program_id, program_slug, status, enrollment_state')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('documents')
      .select('document_type', { count: 'exact' })
      .eq('user_id', user.id),
    supabase.from('license_agreement_acceptances')
      .select('agreement_key:agreement_type')
      .eq('user_id', user.id),
    supabase.from('handbook_acknowledgments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1),
    // Check identity via documents table (id_verifications has no user_id column)
    supabase.from('documents')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('document_type', 'photo_id')
      .limit(1)
      .maybeSingle(),
    supabase.from('orientation_completions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1),
  ]);

  const profile = profileResult.data;
  const enrollment = enrollmentResult.data;
  const docCount = docCountResult.count || 0;
  const signedAgreementTypes = new Set(
    (agreementsResult.data || []).map((a: any) => a.agreement_key),
  );
  const handbookAcknowledged = (handbookResult.data?.length || 0) > 0;
  // Identity verified if user has uploaded a photo_id document
  const identityVerified = !!idDocResult.data;
  const orientationDone = !!profile?.orientation_completed || (orientationResult.data?.length || 0) > 0;

  // Look up program name from apprenticeship_programs (FK target for program_enrollments)
  let enrollmentProgramName: string | null = null;
  if (enrollment?.program_id) {
    const { data: prog } = await supabase
      .from('apprenticeship_programs')
      .select('name')
      .eq('id', enrollment.program_id)
      .maybeSingle();
    enrollmentProgramName = prog?.name || null;
  }

  // Determine completed steps from real DB state
  const completedSteps: string[] = [];

  if (orientationDone) completedSteps.push('orientation');

  if (profile?.full_name && profile?.phone) {
    completedSteps.push('profile');
  } else if (profile?.first_name && profile?.last_name && profile?.phone) {
    completedSteps.push('profile');
  }

  if (docCount > 0) {
    completedSteps.push('documents');
  }

  if (identityVerified) {
    completedSteps.push('verification');
  }

  if (handbookAcknowledged) {
    completedSteps.push('handbook');
  }

  if (signedAgreementTypes.size > 0) {
    completedSteps.push('agreements');
  }

  if (profile?.funding_confirmed) {
    completedSteps.push('funding');
  }

  if (profile?.schedule_selected) {
    completedSteps.push('schedule');
  }

  const progress = Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100);
  const allComplete = completedSteps.length === ONBOARDING_STEPS.length;

  const isOnboardingComplete = allComplete || profile?.onboarding_completed;

  // When all steps are complete, mark onboarding done and notify admin.
  // Do NOT auto-grant LMS access — admin reviews and grants access manually.
  let justCompleted = false;
  if (allComplete && !profile?.onboarding_completed) {
    try {
      // sendEmail suppressed — admin triggers manually

      // Mark onboarding complete — does NOT grant LMS access
      await supabase.from('profiles').update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }).eq('id', user.id);

      justCompleted = true;

      const emailAddr = profile?.email || user.email || '';
      const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Student';
      const resolvedProgramName = enrollmentProgramName || 'your training program';
      const siteUrlInner = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
      const logoUrl = `${siteUrlInner}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;

      // Emails suppressed — admin will trigger manually when ready
      // TODO: re-enable student + admin notification emails when approved
      void emailAddr; void logoUrl; void siteUrlInner; void resolvedProgramName; void firstName;
    } catch (err) {
      logger.error('[onboarding] Completion failed', err as Error);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const studentName = profile?.first_name || 'Student';
  const programName = enrollmentProgramName || 'your selected program';

  // Find next incomplete step
  const nextStep = ONBOARDING_STEPS.find(s => !completedSteps.includes(s.id));

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Student Onboarding' }]} />

      {/* VIDEO HERO — full bleed, no text on top */}
      <div className="relative w-full overflow-hidden" style={{ height: '55vh', minHeight: 280, maxHeight: 500 }}>
        <CanonicalVideo
          src="/videos/getting-started-hero.mp4"
          poster="/images/pages/onboarding-page-2.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Page header below video */}
      <section className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl">
            <p className="text-brand-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">
              Student Onboarding
            </p>
            <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
              Welcome to Elevate for Humanity
            </h1>
            <p className="text-slate-500">
              {enrollmentProgramName
                ? `Complete your onboarding for ${enrollmentProgramName} to begin training.`
                : 'Complete these steps to finalize your enrollment and start your training program.'}
            </p>

            {/* Progress */}
            <div className="max-w-md mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-500">{completedSteps.length} of {ONBOARDING_STEPS.length} steps complete</span>
                <span className="font-bold text-slate-700">{progress}%</span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Enrollment approved — student can access courses */}
        {profile?.enrollment_status === 'active' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0">
              <Image src="/images/pages/onboarding-page-1.jpg" alt="Enrollment approved" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-black text-slate-900 mb-1">Enrollment Approved</h2>
              <p className="text-slate-500 text-sm">Your enrollment has been approved. Access your courses and begin training.</p>
            </div>
            <Link href="/learner/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-xl font-bold hover:bg-brand-blue-700 transition flex-shrink-0">
              Go to Student Portal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* All steps just completed — pending admin review */}
        {justCompleted && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 mb-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-black text-slate-900 mb-1">Onboarding Complete — Pending Review</h2>
              <p className="text-slate-500 text-sm">All steps are done. Our team is reviewing your documents and will grant access within 1 business day. Check your email for confirmation.</p>
            </div>
            <Link href="/learner/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-700 transition flex-shrink-0">
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Already completed — still waiting for access */}
        {!justCompleted && isOnboardingComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 mb-10 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-black text-slate-900 mb-1">Onboarding Complete</h2>
              <p className="text-slate-500 text-sm">Your documents are under review. You'll receive an email once access is granted. Questions? Call (317) 314-3757.</p>
            </div>
            <Link href="/learner/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-700 transition flex-shrink-0">
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Not yet complete — info banner */}
        {!isOnboardingComplete && (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-4 sm:p-5 mb-8 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-brand-blue-600" />
            </div>
            <div>
              <p className="text-brand-blue-900 font-semibold text-sm">Complete all steps to begin training</p>
              <p className="text-brand-blue-700 text-sm mt-0.5">
                Each step takes 2-5 minutes. Once all steps are done, you&apos;ll be automatically enrolled.
              </p>
            </div>
          </div>
        )}

        {/* Onboarding Steps */}
        <div className="space-y-3">
          {ONBOARDING_STEPS.map((step, index) => {
            const isComplete = completedSteps.includes(step.id);
            const isNext = nextStep?.id === step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`group overflow-hidden rounded-2xl border transition-all bg-white ${
                  isNext ? 'border-brand-blue-300 shadow-sm' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Step image */}
                  <div className="relative w-full sm:w-44 h-36 sm:h-auto flex-shrink-0 overflow-hidden">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, 176px"
                      className={`object-cover ${isComplete ? 'opacity-50 grayscale' : ''}`}
                    />
                    {/* Step number — plain white pill, no color */}
                    <div className="absolute top-3 left-3 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-slate-700">
                      {index + 1}
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 p-5 flex flex-col justify-center">
                    <div className="flex items-start gap-3">
                      <div className="hidden sm:flex w-9 h-9 rounded-xl bg-white items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900">{step.title}</h3>
                          {isComplete && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider bg-white text-slate-500 px-2 py-0.5 rounded-full">Done</span>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed mb-3">{step.description}</p>

                        {!isComplete && (
                          <Link
                            href={step.href}
                            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
                              isNext
                                ? 'bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700'
                                : 'text-brand-blue-600 hover:text-brand-blue-800'
                            }`}
                          >
                            {isNext ? 'Start' : 'Complete'}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <section className="mt-12 sm:mt-16">
          <div className="relative overflow-hidden rounded-2xl bg-white aspect-[4/3]">
            <div className="absolute inset-0">
              <Image
                src="/images/pages/onboarding.jpg"
                alt="Contact Elevate for Humanity support"
                fill
                className="object-cover opacity-20"
               sizes="100vw" />
            </div>
            <div className="relative p-6 sm:p-10 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">Need Help?</h3>
              <p className="text-slate-600 mb-6 max-w-lg mx-auto">
                Our enrollment team is available Monday through Friday to help you complete your onboarding.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-brand-blue-600 text-white rounded-xl hover:bg-brand-blue-700 font-semibold transition"
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                </Link>
                <a
                  href="tel:+13173143757"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 font-semibold transition backdrop-blur-sm"
                >
                  <Phone className="w-4 h-4" />
                  (317) 314-3757
                </a>
                <Link
                  href="/support/help"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 font-semibold transition backdrop-blur-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
