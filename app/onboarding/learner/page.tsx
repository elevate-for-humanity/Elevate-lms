import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, FileText, CreditCard, Calendar, User, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

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
    id: 'orientation',
    title: 'Complete Orientation',
    description: 'Watch the orientation video and acknowledge policies',
    href: '/onboarding/learner/orientation',
    icon: BookOpen,
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

  // If all steps complete, mark onboarding as done in profile
  if (allComplete && profile && !profile.onboarding_completed) {
    await db
      .from('profiles')
      .update({ 
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', user.id);
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
        {allComplete ? (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-6 mb-8 text-center">
            <span className="text-slate-400 flex-shrink-0">•</span>
            <h2 className="text-2xl font-bold text-brand-green-900 mb-2">Onboarding Complete!</h2>
            <p className="text-brand-green-700 mb-4">
              You're all set to begin your training. Head to your dashboard to get started.
            </p>
            <Link
              href="/lms/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700"
            >
              Go to Dashboard
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
