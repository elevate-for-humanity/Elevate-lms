import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, FileText, CreditCard, Calendar, User, ArrowRight, Phone, Mail, HelpCircle, ClipboardCheck } from 'lucide-react';
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
  image: string;
  imageAlt: string;
  required: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your contact information, emergency contacts, and preferences so we can support you throughout the program.',
    href: '/profile/edit',
    icon: User,
    image: '/images/heroes-hq/about-hero.jpg',
    imageAlt: 'Student completing profile at Elevate for Humanity',
    required: true,
  },
  {
    id: 'documents',
    title: 'Upload Required Documents',
    description: 'Submit your government-issued ID, proof of eligibility (WIOA letter, referral, or self-pay agreement), and any prior certifications.',
    href: '/documents/upload',
    icon: FileText,
    image: '/images/heroes-hq/how-it-works-hero.jpg',
    imageAlt: 'Document submission process',
    required: true,
  },
  {
    id: 'funding',
    title: 'Confirm Funding Source',
    description: 'Review and confirm how your training will be funded — WIOA sponsorship, DOL grant, employer sponsorship, or self-pay.',
    href: '/funding/confirm',
    icon: CreditCard,
    image: '/images/heroes-hq/funding-hero.jpg',
    imageAlt: 'Funding and financial aid options',
    required: true,
  },
  {
    id: 'schedule',
    title: 'Select Your Schedule',
    description: 'Choose your preferred class times and cohort start date. Day and evening options available.',
    href: '/schedule/select',
    icon: Calendar,
    image: '/images/programs-hq/training-classroom.jpg',
    imageAlt: 'Training classroom schedule selection',
    required: true,
  },
  {
    id: 'orientation',
    title: 'Complete Orientation',
    description: 'Watch the orientation video, review program policies, attendance requirements, and acknowledge the student handbook.',
    href: '/onboarding/learner/orientation',
    icon: BookOpen,
    image: '/images/programs-hq/students-learning.jpg',
    imageAlt: 'Students in orientation session',
    required: true,
  },
];

export default async function LearnerOnboardingPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) { redirect("/login"); }
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
    db.from('profiles')
      .select('*, onboarding_completed, funding_confirmed, funding_source, orientation_completed, schedule_selected, enrollment_status, full_name, first_name, last_name, phone, address')
      .eq('id', user.id)
      .single(),
    db.from('program_enrollments')
      .select('id, program_id, program_slug, status, enrollment_state')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from('documents')
      .select('document_type', { count: 'exact' })
      .eq('user_id', user.id),
    db.from('agreement_acceptances')
      .select('agreement_key')
      .eq('subject_id', user.id),
    db.from('handbook_acknowledgments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1),
    // Check identity via documents table (id_verifications has no user_id column)
    db.from('documents')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('document_type', 'photo_id')
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
    (agreementsResult.data || []).map((a: any) => a.agreement_key),
  );
  const handbookAcknowledged = (handbookResult.data?.length || 0) > 0;
  // Identity verified if user has uploaded a photo_id document
  const identityVerified = !!idDocResult.data;
  const orientationDone = profile?.orientation_completed || (orientationResult.data?.length || 0) > 0;

  // Look up program name from apprenticeship_programs (FK target for program_enrollments)
  let enrollmentProgramName: string | null = null;
  if (enrollment?.program_id) {
    const { data: prog } = await db
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

  if (allComplete && profile && !profile.onboarding_completed) {
    await db
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', user.id);
  }

  const isOnboardingComplete = allComplete || profile?.onboarding_completed;

  // Auto-enroll when all onboarding steps are complete
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const studentName = profile?.first_name || 'Student';
  const programName = enrollmentProgramName || 'your selected program';
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
      const programSlug = application.program_interest?.toLowerCase().replace(/\s+/g, '-').trim() || '';

      // Resolve program ID from slug if not set on the application
      if (!programId && programSlug) {
        const { data: programRow } = await db.from('programs').select('id').eq('slug', programSlug).eq('is_active', true).maybeSingle();
        programId = programRow?.id || null;
      }

      await db.from('applications').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', application.id);

      if (programId) {
        await db.from('program_enrollments').upsert({
          user_id: user.id, program_id: programId, program_slug: programSlug, email: user.email,
          full_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim(),
          amount_paid_cents: 0, funding_source: 'pending', status: 'pending_approval', enrollment_state: 'pending_approval',
        }, { onConflict: 'user_id,program_id', ignoreDuplicates: true });

        // Find courses for this program
        let { data: courses } = await db.from('training_courses').select('id, program_id').eq('program_id', programId).eq('is_active', true);

        // Fallback: program_id mismatch across programs/training_courses tables.
        // Use controlled keyword from the program name (not user free text).
        if ((!courses || courses.length === 0) && programSlug) {
          const SLUG_TO_TOKEN: Record<string, string> = {
            'hvac-technician': 'HVAC', 'hvac': 'HVAC', 'hvac-2024': 'HVAC',
            'cna-training': 'CNA', 'cna': 'CNA', 'cna-certification': 'CNA',
            'cdl': 'CDL', 'cdl-commercial-driving': 'CDL',
            'welding': 'Welding', 'welding-certification': 'Welding',
            'phlebotomy': 'Phlebotomy', 'phlebotomy-technician': 'Phlebotomy',
            'barber': 'Barber', 'barber-apprenticeship': 'Barber',
            'medical-assistant': 'Medical Assistant',
            'cybersecurity': 'Cybersecurity',
            'it-support': 'IT Support', 'it-support-specialist': 'IT Support',
            'electrical': 'Electrical', 'electrical-apprenticeship': 'Electrical',
            'plumbing': 'Plumbing', 'plumbing-apprenticeship': 'Plumbing',
            'tax-preparation': 'Tax Preparation',
          };
          const token = SLUG_TO_TOKEN[programSlug];
          if (token) {
            const { data: fallback } = await db.from('training_courses').select('id, program_id').ilike('course_name', `%${token}%`).eq('is_active', true);
            // Only use fallback if all results belong to a single program (no ambiguity)
            if (fallback && fallback.length > 0) {
              const programIds = new Set(fallback.map((c: any) => c.program_id).filter(Boolean));
              if (programIds.size <= 1) {
                courses = fallback;
              } else {
                logger.error('Ambiguous course fallback — multiple program_ids', { programSlug, token, programIds: [...programIds] });
              }
            }
          }
        }

        if (courses && courses.length > 0) {
          await db.from('training_enrollments').upsert(
            courses.map((c: any) => ({ user_id: user.id, course_id: c.id, status: 'pending_approval', progress: 0, enrolled_at: new Date().toISOString() })),
            { onConflict: 'user_id,course_id', ignoreDuplicates: true }
          );
        } else {
          logger.error('No active courses found for auto-enrollment', { programId, programSlug, userId: user.id });
        }
      }

      await db.from('profiles').update({ enrollment_status: 'pending_approval' }).eq('id', user.id);
      justEnrolled = true;

      // Email 1: Student — onboarding complete, pending admin review
      try {
        await sendEmail({
          to: user.email!,
          subject: `Onboarding Complete — ${programName} | Elevate for Humanity`,
          html: [
            `<h2 style="font-weight:normal;font-size:22px;margin:0 0 20px;color:#1a1a1a">Hi ${studentName},</h2>`,
            `<p style="font-size:15px;line-height:1.6;color:#334155">Your onboarding for <strong>${programName}</strong> is complete. All your documents and information have been submitted.</p>`,
            `<div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:16px 0">`,
            `<p style="margin:0 0 8px;font-weight:bold;color:#92400e">What happens next?</p>`,
            `<p style="margin:0;color:#78350f;font-size:14px">An administrator will review your enrollment. Once approved, you will receive a separate email confirming your start date and course access.</p>`,
            `</div>`,
            `<p style="font-size:14px;color:#475569">You do not need to take any further action at this time. We will contact you directly once your enrollment has been reviewed.</p>`,
            `<p style="font-size:14px;color:#475569">Questions? Reply to this email or call <strong>(317) 314-3757</strong>.</p>`,
            `<p style="font-size:14px;color:#64748b;margin-top:24px">— Elevate for Humanity</p>`,
          ].join(''),
        });
      } catch (emailErr) {
        logger.warn('Failed to send student onboarding-complete email', emailErr as Error);
      }

      // Email 2: Admin — new student needs enrollment approval
      try {
        const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';
        await sendEmail({
          to: adminEmail,
          subject: `Action Required: ${studentName} completed onboarding for ${programName}`,
          html: [
            `<h2 style="font-weight:normal;font-size:22px;margin:0 0 20px;color:#1a1a1a">New Student Enrollment Pending Approval</h2>`,
            `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0">`,
            `<p style="margin:0 0 8px"><strong>Student:</strong> ${studentName} (${user.email})</p>`,
            `<p style="margin:0 0 8px"><strong>Program:</strong> ${programName}</p>`,
            `<p style="margin:0"><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`,
            `</div>`,
            `<p style="font-size:15px;color:#334155">This student has completed all onboarding steps and is waiting for admin approval to begin coursework.</p>`,
            `<p style="text-align:center;margin:24px 0"><a href="${siteUrl}/admin/enrollments" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Review Enrollments</a></p>`,
            `<p style="font-size:13px;color:#64748b">— Elevate LMS Notifications</p>`,
          ].join(''),
        });
      } catch (emailErr) {
        logger.warn('Failed to send admin enrollment notification', emailErr as Error);
      }
    }
  }

  // Find next incomplete step
  const nextStep = ONBOARDING_STEPS.find(s => !completedSteps.includes(s.id));

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Student Onboarding' }]} />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <Image
            src="/images/heroes-hq/success-hero.jpg"
            alt="Students at Elevate for Humanity"
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-brand-blue-400 text-sm font-semibold uppercase tracking-wider mb-2">
              Student Onboarding
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              Welcome to Elevate for Humanity
            </h1>
            <p className="text-lg text-slate-300 mb-6 leading-relaxed">
              {enrollmentProgramName
                ? `Complete your onboarding for ${enrollmentProgramName} to begin training.`
                : 'Complete these steps to finalize your enrollment and start your training program.'}
            </p>

            {/* Progress */}
            <div className="max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">{completedSteps.length} of {ONBOARDING_STEPS.length} steps complete</span>
                <span className="font-bold text-white">{progress}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-green-500 rounded-full transition-all duration-500"
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
          <div className="relative overflow-hidden bg-brand-green-50 border-2 border-brand-green-200 rounded-2xl p-6 sm:p-8 mb-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0">
                <Image
                  src="/images/heroes-hq/success-stories-hero.jpg"
                  alt="Enrollment approved"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-brand-green-900 mb-1">You&apos;re Approved!</h2>
                <p className="text-brand-green-700">
                  Your enrollment has been approved. Log in to your student portal to access your courses and begin training.
                </p>
              </div>
              <Link
                href="/lms/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-green-600 text-white rounded-xl hover:bg-brand-green-700 font-bold transition-all hover:shadow-lg flex-shrink-0"
              >
                Go to Student Portal
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        )}

        {/* Pending admin approval banner */}
        {(justEnrolled || profile?.enrollment_status === 'pending_approval') && profile?.enrollment_status !== 'active' && (
          <div className="relative overflow-hidden bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 sm:p-8 mb-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />
            <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <ClipboardCheck className="w-10 h-10 text-amber-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-amber-900 mb-1">Onboarding Complete — Pending Admin Approval</h2>
                <p className="text-amber-800 mb-2">
                  All your onboarding steps are done. An administrator will review your enrollment and documents.
                </p>
                <p className="text-amber-700 text-sm">
                  You will receive an email once your enrollment is approved with instructions on when you can start class.
                  No further action is needed from you at this time.
                </p>
              </div>
            </div>
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

        {/* Onboarding Steps — card grid with real images */}
        <div className="space-y-4 sm:space-y-5">
          {ONBOARDING_STEPS.map((step, index) => {
            const isComplete = completedSteps.includes(step.id);
            const isNext = nextStep?.id === step.id;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all ${
                  isComplete
                    ? 'border-brand-green-200 bg-white'
                    : isNext
                      ? 'border-brand-blue-300 bg-white shadow-md shadow-brand-blue-100'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Step image */}
                  <div className="relative w-full sm:w-48 lg:w-56 h-40 sm:h-auto flex-shrink-0">
                    <Image
                      src={step.image}
                      alt={step.imageAlt}
                      fill
                      className={`object-cover ${isComplete ? 'opacity-60' : ''}`}
                    />
                    {/* Step number overlay */}
                    <div className={`absolute top-3 left-3 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isComplete
                        ? 'bg-brand-green-500 text-white'
                        : isNext
                          ? 'bg-brand-blue-600 text-white'
                          : 'bg-white/90 text-slate-700 backdrop-blur-sm'
                    }`}>
                      {isComplete ? '✓' : index + 1}
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                    <div className="flex items-start gap-3">
                      <div className={`hidden sm:flex w-10 h-10 rounded-xl items-center justify-center flex-shrink-0 ${
                        isComplete
                          ? 'bg-brand-green-100'
                          : isNext
                            ? 'bg-brand-blue-100'
                            : 'bg-slate-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isComplete
                            ? 'text-brand-green-600'
                            : isNext
                              ? 'text-brand-blue-600'
                              : 'text-slate-500'
                        }`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold text-base sm:text-lg ${
                            isComplete ? 'text-brand-green-900' : 'text-slate-900'
                          }`}>
                            {step.title}
                          </h3>
                          {step.required && !isComplete && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-orange-100 text-brand-orange-700 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          )}
                          {isComplete && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-green-100 text-brand-green-700 px-2 py-0.5 rounded-full">
                              Done
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed mb-3">{step.description}</p>

                        {isComplete ? (
                          <span className="text-sm text-brand-green-600 font-semibold">Step completed</span>
                        ) : (
                          <Link
                            href={step.href}
                            className={`inline-flex items-center gap-2 text-sm font-bold transition-colors ${
                              isNext
                                ? 'bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-blue-700'
                                : 'text-brand-blue-600 hover:text-brand-blue-800'
                            }`}
                          >
                            {isNext ? 'Start This Step' : 'Complete This Step'}
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
          <div className="relative overflow-hidden rounded-2xl bg-slate-900">
            <div className="absolute inset-0">
              <Image
                src="/images/heroes-hq/contact-hero.jpg"
                alt="Contact Elevate for Humanity support"
                fill
                className="object-cover opacity-20"
              />
            </div>
            <div className="relative p-6 sm:p-10 text-center">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Need Help?</h3>
              <p className="text-slate-300 mb-6 max-w-lg mx-auto">
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
                  href="/help"
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
