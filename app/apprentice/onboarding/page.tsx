import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Circle, ChevronRight, MapPin, Clock, FileText, BookOpen, User, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Onboarding | Apprentice Portal',
  description: 'Complete your apprenticeship onboarding steps.',
};

export const dynamic = 'force-dynamic';

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed: boolean;
}

export default async function ApprenticeOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/onboarding');
  }

  // Get apprentice info
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('*, shops:shop_id(name)')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get onboarding progress
  const { data: onboarding } = await supabase
    .from('apprentice_onboarding_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, phone')
    .eq('id', user.id)
    .maybeSingle();

  const shopName = (apprentice?.shops as any)?.name || 'Your Host Shop';

  // Define onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      label: 'Complete Your Profile',
      description: 'Add your photo, phone number, and contact info',
      icon: User,
      href: '/apprentice/profile',
      completed: onboarding?.profile_completed || false,
    },
    {
      id: 'documents',
      label: 'Upload Required Documents',
      description: 'Government ID, Social Security Card, High School Diploma/GED',
      icon: FileText,
      href: '/apprentice/documents',
      completed: onboarding?.documents_uploaded || false,
    },
    {
      id: 'host_shop',
      label: 'Meet Your Host Shop',
      description: `Learn about ${shopName} where you'll be training`,
      icon: MapPin,
      href: '/apprentice/host-shop',
      completed: onboarding?.host_shop_intro || false,
    },
    {
      id: 'clock_training',
      label: 'Clock-In Training',
      description: 'Learn how to use the GPS timeclock system',
      icon: Clock,
      href: '/apprentice/timeclock',
      completed: onboarding?.clock_in_training || false,
    },
    {
      id: 'syllabus',
      label: 'Review Curriculum',
      description: 'Understand the barber apprenticeship requirements',
      icon: BookOpen,
      href: '/apprentice/competencies',
      completed: onboarding?.syllabus_review || false,
    },
    {
      id: 'agreement',
      label: 'Sign Apprenticeship Agreement',
      description: 'Review and sign your DOL apprenticeship agreement',
      icon: FileText,
      href: '/apprentice/documents',
      completed: onboarding?.agreement_signed || false,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allComplete = completedCount === steps.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs
        items={[{ label: 'Apprentice Portal', href: '/apprentice' }, { label: 'Onboarding' }]}
      />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Apprentice'}! 👋
          </h1>
          <p className="text-slate-600">
            Complete these steps to get started with your barber apprenticeship at {shopName}.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Your Progress</h2>
              <p className="text-sm text-slate-500">
                {completedCount} of {steps.length} steps complete
              </p>
            </div>
            <div className="text-3xl font-bold text-brand-blue-600">{progressPercent}%</div>
          </div>
          
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-brand-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {allComplete && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Onboarding Complete!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                You're all set to start your apprenticeship journey. Clock in at your host shop to begin logging hours!
              </p>
            </div>
          )}
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isNext = !step.completed && (index === 0 || steps.slice(0, index).every((s) => s.completed));

            return (
              <Link
                key={step.id}
                href={step.href}
                className={`block bg-white rounded-xl border p-5 transition-all hover:shadow-md hover:border-brand-blue-200 ${
                  step.completed
                    ? 'border-green-200'
                    : isNext
                    ? 'border-brand-blue-300 ring-2 ring-brand-blue-100'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      step.completed
                        ? 'bg-green-100 text-green-600'
                        : isNext
                        ? 'bg-brand-blue-100 text-brand-blue-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold ${
                          step.completed ? 'text-green-900' : 'text-slate-900'
                        }`}
                      >
                        {step.label}
                      </h3>
                      {isNext && !step.completed && (
                        <span className="px-2 py-0.5 bg-brand-blue-100 text-brand-blue-700 text-xs font-medium rounded-full">
                          Next Step
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-1 ${step.completed ? 'text-green-700' : 'text-slate-500'}`}>
                      {step.description}
                    </p>
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 shrink-0 ${
                      step.completed ? 'text-green-400' : 'text-slate-400'
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-8 p-6 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Need Help?</h3>
              <p className="text-sm text-amber-800 mt-1">
                If you have questions about your apprenticeship, contact your mentor or reach out to support at (317) 314-3757.
              </p>
              <Link
                href="/support"
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 mt-2"
              >
                Contact Support <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Skip to Dashboard */}
        <div className="mt-6 text-center">
          <Link
            href="/apprentice"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Skip onboarding and go to dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
