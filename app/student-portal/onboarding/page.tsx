'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { updateOnboardingProgress } from '@/lib/compliance/enforcement';
import {
  User,
  FileText,
  BookOpen,
  Upload,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface OnboardingStep {
  id: 'profile' | 'agreements' | 'handbook' | 'documents';
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  required: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your contact information, emergency contacts, and preferences',
    icon: User,
    href: '/student-portal/profile',
    required: true,
  },
  {
    id: 'agreements',
    title: 'Sign Required Agreements',
    description: 'Review and sign enrollment agreement, FERPA consent, and participation agreement',
    icon: FileText,
    href: '/student-portal/onboarding/agreements',
    required: true,
  },
  {
    id: 'handbook',
    title: 'Acknowledge Student Handbook',
    description: 'Read and acknowledge the student handbook policies',
    icon: BookOpen,
    href: '/student-portal/handbook/acknowledge',
    required: true,
  },
  {
    id: 'documents',
    title: 'Upload Required Documents',
    description: 'Submit ID, proof of eligibility, and any required certifications',
    icon: Upload,
    href: '/student-portal/onboarding/documents',
    required: false,
  },
];

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, boolean>>({
    profile: false,
    agreements: false,
    handbook: false,
    documents: false,
  });

  useEffect(() => {
    const supabase = createClient();

    supabase?.auth.getUser().then(async ({ data, error }) => {
      if (error || !data?.user) {
        router.push('/login?next=/student-portal/onboarding');
        return;
      }

      setUser(data.user);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      setProfile(profileData);

      // Check onboarding progress
      const { data: onboardingData } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (onboardingData) {
        setProgress({
          profile: onboardingData.profile_completed || false,
          agreements: onboardingData.agreements_completed || false,
          handbook: onboardingData.handbook_acknowledged || false,
          documents: onboardingData.documents_uploaded || false,
        });

        // If all required steps complete, redirect to LMS
        if (
          onboardingData.profile_completed &&
          onboardingData.agreements_completed &&
          onboardingData.handbook_acknowledged
        ) {
          router.push('/lms/dashboard');
          return;
        }
      } else {
        // Create onboarding progress record
        await supabase.from('onboarding_progress').insert({
          user_id: data.user.id,
          status: 'in_progress',
        });
      }

      // Check if profile is complete
      if (profileData?.full_name && profileData?.phone) {
        setProgress((prev) => ({ ...prev, profile: true }));
        await updateOnboardingProgress(data.user.id, 'profile', true);
      }

      // Check agreement acceptances
      const { data: agreements } = await supabase
        .from('license_agreement_acceptances')
        .select('agreement_type')
        .eq('user_id', data.user.id);

      const acceptedTypes = agreements?.map((a) => a.agreement_type) || [];
      const requiredAgreements = ['enrollment', 'participation', 'ferpa'];
      const allAgreementsSigned = requiredAgreements.every((type) =>
        acceptedTypes.includes(type)
      );

      if (allAgreementsSigned) {
        setProgress((prev) => ({ ...prev, agreements: true }));
        await updateOnboardingProgress(data.user.id, 'agreements', true);
      }

      // Check handbook acknowledgment
      const { data: handbook } = await supabase
        .from('handbook_acknowledgments')
        .select('id')
        .eq('user_id', data.user.id)
        .single();

      if (handbook) {
        setProgress((prev) => ({ ...prev, handbook: true }));
        await updateOnboardingProgress(data.user.id, 'handbook', true);
      }

      setLoading(false);
    });
  }, [router]);

  const completedSteps = Object.values(progress).filter(Boolean).length;
  const requiredSteps = ONBOARDING_STEPS.filter((s) => s.required).length;
  const requiredComplete = ONBOARDING_STEPS.filter(
    (s) => s.required && progress[s.id]
  ).length;

  const getNextStep = () => {
    for (const step of ONBOARDING_STEPS) {
      if (step.required && !progress[step.id]) {
        return step;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your onboarding progress...</p>
        </div>
      </div>
    );
  }

  const nextStep = getNextStep();

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome to Elevate, {profile?.full_name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="text-slate-600">
            Complete the following steps to access your courses and begin learning.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Onboarding Progress
            </span>
            <span className="text-sm text-slate-500">
              {requiredComplete} of {requiredSteps} required steps complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(requiredComplete / requiredSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Alert for incomplete required steps */}
        {requiredComplete < requiredSteps && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">Action Required</p>
              <p className="text-amber-700 text-sm">
                You must complete all required steps before accessing your courses.
                {nextStep && (
                  <> Next: <strong>{nextStep.title}</strong></>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Steps List */}
        <div className="space-y-4">
          {ONBOARDING_STEPS.map((step, index) => {
            const isComplete = progress[step.id];
            const isNext = nextStep?.id === step.id;
            const Icon = step.icon;

            return (
              <Link
                key={step.id}
                href={step.href}
                className={`block bg-white rounded-xl shadow-sm p-6 transition-all ${
                  isComplete
                    ? 'border-2 border-green-500'
                    : isNext
                    ? 'border-2 border-blue-500 ring-2 ring-blue-100'
                    : 'border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Step Number / Check */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isComplete
                        ? 'bg-green-100'
                        : isNext
                        ? 'bg-blue-100'
                        : 'bg-slate-100'
                    }`}
                  >
                    {isComplete ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <Icon
                        className={`w-6 h-6 ${
                          isNext ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold ${
                          isComplete
                            ? 'text-green-900'
                            : isNext
                            ? 'text-blue-900'
                            : 'text-slate-900'
                        }`}
                      >
                        {step.title}
                      </h3>
                      {step.required && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                      {isComplete && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Complete
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight
                    className={`w-5 h-5 flex-shrink-0 ${
                      isComplete
                        ? 'text-green-400'
                        : isNext
                        ? 'text-blue-400'
                        : 'text-slate-300'
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Continue Button */}
        {requiredComplete === requiredSteps ? (
          <div className="mt-8 text-center">
            <Link
              href="/lms/dashboard"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Continue to Dashboard
              <ChevronRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-2">
              All required steps complete! You can now access your courses.
            </p>
          </div>
        ) : nextStep ? (
          <div className="mt-8 text-center">
            <Link
              href={nextStep.href}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue: {nextStep.title}
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : null}

        {/* Help Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            Need help?{' '}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
