import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, CreditCard, Calendar, User, ArrowRight } from 'lucide-react';
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
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your contact information, emergency contacts, and preferences',
    href: '/profile/edit',
    icon: User,
    required: true,
  },
  {
    id: 'documents',
    title: 'Upload Required Documents',
    description: 'Submit ID, proof of eligibility, and any required certifications',
    href: '/documents/upload',
    icon: FileText,
    required: true,
  },
  {
    id: 'funding',
    title: 'Confirm Funding',
    description: 'Review and confirm your funding source (WIOA, scholarship, self-pay)',
    href: '/funding/confirm',
    icon: CreditCard,
    required: true,
  },
  {
    id: 'schedule',
    title: 'Select Your Schedule',
    description: 'Choose your preferred class times and start date',
    href: '/schedule/select',
    icon: Calendar,
    required: true,
  },
  {
    id: 'orientation',
    title: 'Complete Orientation',
    description: 'Watch the orientation video and acknowledge policies',
    href: '/onboarding/learner/orientation',
    icon: BookOpen,
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

  const { data: profile } = await db
    .from('profiles')
    .select('*, onboarding_completed, funding_confirmed, funding_source, orientation_completed, schedule_selected, enrollment_status')
    .eq('id', user.id)
    .single();

  // Get enrollment status
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('*, programs(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Check completed steps
  const completedSteps: string[] = [];
  
  if (profile?.full_name && profile?.phone) {
    completedSteps.push('profile');
  }
  
  // Check for uploaded documents
  const { count: docCount } = await db
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  
  if (docCount && docCount > 0) {
    completedSteps.push('documents');
  }

  if (profile?.funding_confirmed) {
    completedSteps.push('funding');
  }

  if (profile?.orientation_completed) {
    completedSteps.push('orientation');
  }

  if (profile?.schedule_selected) {
    completedSteps.push('schedule');
  }

  const progress = Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100);
  const allComplete = completedSteps.length === ONBOARDING_STEPS.length;

  // If all steps complete, mark onboarding as done
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

  // Auto-enroll when all onboarding steps are complete (documents are auto-verified on upload)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const studentName = profile?.first_name || 'Student';
  const programName = enrollment?.programs?.name || 'your selected program';
  let justEnrolled = false;

  if (isOnboardingComplete && profile?.enrollment_status !== 'active') {
    // Find pending application
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

      // Approve application
      await db.from('applications').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', application.id);

      // Resolve program slug
      const programSlug = application.program_interest?.toLowerCase().replace(/\s+/g, '-').trim() || '';

      // Create enrollment
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
            { onConflict: 'user_id,course_id', ignoreDuplicates: true }
          );
        }
      }

      await db.from('profiles').update({ enrollment_status: 'active' }).eq('id', user.id);
      justEnrolled = true;

      // Send enrollment confirmation email
      try {
        await sendEmail({
          to: user.email!,
          subject: `You're Enrolled! Welcome to ${programName} — Elevate for Humanity`,
          html: [
            `<h2>Hi ${studentName},</h2>`,
            `<p>Your onboarding is complete and all documents have been verified. You are now enrolled in <strong>${programName}</strong>.</p>`,
            `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:12px 0">`,
            `<p style="margin:0 0 8px;font-weight:bold">Your Login:</p>`,
            `<p style="margin:0">Email: <strong>${user.email}</strong></p>`,
            `<p style="margin:8px 0 0;font-size:13px;color:#64748b">Use the password from your welcome email. Forgot it? <a href="${siteUrl}/reset-password">Reset it here</a></p>`,
            `</div>`,
            `<p><strong>Next steps:</strong></p>`,
            `<ol>`,
            `<li>Log in to your student portal</li>`,
            `<li>Complete the required orientation (about 10 minutes)</li>`,
            `<li>Once orientation is done, your courses will be unlocked</li>`,
            `</ol>`,
            `<p style="text-align:center"><a href="${siteUrl}/lms/dashboard" style="display:inline-block;padding:12px 24px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Log In to Student Portal</a></p>`,
            `<p>Questions? Reply to this email or call (317) 314-3757.</p>`,
            `<p>— Elevate for Humanity</p>`,
          ].join(''),
        });
      } catch (emailErr) {
        logger.warn('Failed to send enrollment email', emailErr as Error);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding', href: '/onboarding' }, { label: 'Learner' }]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-brand-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Welcome to Elevate for Humanity</h1>
          <p className="text-brand-blue-100 text-lg">
            {enrollment?.programs?.name 
              ? `Complete your onboarding for ${enrollment.programs.name}`
              : 'Complete these steps to get started with your training'}
          </p>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Onboarding Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="h-3 bg-brand-blue-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-green-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {justEnrolled || profile?.enrollment_status === 'active' ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6 mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green-100 rounded-full mb-4">
              <ArrowRight className="w-8 h-8 text-brand-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-brand-green-900 mb-2">You&apos;re Enrolled!</h2>
            <p className="text-brand-green-700 mb-4">
              Your onboarding is complete and you are enrolled. Log in to your student portal to complete orientation and access your courses.
            </p>
            <Link
              href="/lms/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 font-semibold"
            >
              Go to Student Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-8">
            <p className="text-brand-blue-800">
              Complete all steps below to finish your onboarding and begin your training.
            </p>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {ONBOARDING_STEPS.map((step, index) => {
            const isComplete = completedSteps.includes(step.id);
            const Icon = step.icon;
            
            return (
              <div
                key={step.id}
                className={`bg-white rounded-lg border p-6 ${
                  isComplete ? 'border-brand-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isComplete ? 'bg-brand-green-100' : 'bg-gray-100'
                  }`}>
                    {isComplete ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <span className="text-gray-500 font-semibold">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${isComplete ? 'text-brand-green-900' : 'text-gray-900'}`}>
                        {step.title}
                      </h3>
                      {step.required && !isComplete && (
                        <span className="text-xs bg-brand-red-100 text-brand-red-700 px-2 py-0.5 rounded">Required</span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                    
                    {!isComplete && (
                      <Link
                        href={step.href}
                        className="inline-flex items-center gap-2 text-brand-blue-600 hover:text-brand-blue-800 font-medium text-sm"
                      >
                        <Icon className="w-4 h-4" />
                        Complete this step
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Our support team is here to help you complete your onboarding.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/help"
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Help Center
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
