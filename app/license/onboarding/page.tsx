import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Circle, Building, FileText, Settings } from 'lucide-react';
import LicenseeOnboardingForm from './LicenseeOnboardingForm';

export const metadata: Metadata = {
  title: 'Licensee Onboarding | Elevate For Humanity',
  description: 'Complete your organization setup to start using the platform.',
};

export const dynamic = 'force-dynamic';

export default async function LicenseeOnboardingPage() {
  const supabase = await createClient();
  

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/license/onboarding');

  // Check if user has a license
  const { data: license } = await supabase
    .from('licenses')
    .select(`
      id,
      status,
      plan_id,
      organization_id,
      organizations(id, name, onboarding_completed)
    `)
    .eq('stripe_customer_id', user.id)
    .maybeSingle();

  // Check agreement acceptance status
  const { data: acceptances } = await supabase
    .from('license_agreement_acceptances')
    .select('agreement_type')
    .eq('user_id', user.id);

  const acceptedTypes = acceptances?.map(a => a.agreement_type) || [];
  const requiredAgreements = ['eula', 'tos', 'aup', 'disclosures', 'license'];
  const allAgreementsAccepted = requiredAgreements.every(t => acceptedTypes.includes(t));

  // If onboarding is complete, redirect to dashboard
  const org = license?.organizations as any;
  if (org?.onboarding_completed) {
    redirect('/license');
  }

  const steps = [
    {
      id: 'agreements',
      title: 'Accept Agreements',
      description: 'Review and accept required legal agreements',
      icon: FileText,
      completed: allAgreementsAccepted,
    },
    {
      id: 'organization',
      title: 'Organization Profile',
      description: 'Complete your organization details',
      icon: Building,
      completed: !!org?.name,
    },
    {
      id: 'configuration',
      title: 'Initial Configuration',
      description: 'Set up basic platform settings',
      icon: Settings,
      completed: false,
    },
  ];

  const currentStep = steps.findIndex(s => !s.completed);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Elevate For Humanity</h1>
          <p className="text-slate-700">Complete these steps to start using your license</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-brand-green-100 text-brand-green-600' 
                      : index === currentStep 
                        ? 'bg-brand-blue-100 text-brand-blue-600' 
                        : 'bg-white text-slate-700'
                  }`}>
                    {step.completed ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`font-medium ${step.completed ? 'text-brand-green-600' : index === currentStep ? 'text-brand-blue-600' : 'text-slate-700'}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-slate-700">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${step.completed ? 'bg-brand-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        {currentStep === 0 && !allAgreementsAccepted && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Accept Required Agreements</h2>
            <p className="text-slate-700 mb-6">
              Please review and accept the following agreements to continue. These agreements govern your use of the platform.
            </p>
            
            <div className="space-y-4 mb-8">
              {requiredAgreements.map((type) => {
                const accepted = acceptedTypes.includes(type);
                const labels: Record<string, string> = {
                  eula: 'End User License Agreement',
                  tos: 'Terms of Service',
                  aup: 'Acceptable Use Policy',
                  disclosures: 'Disclosures',
                  license: 'Software License Agreement',
                };
                const urls: Record<string, string> = {
                  eula: '/legal/eula',
                  tos: '/terms-of-service',
                  aup: '/legal/acceptable-use',
                  disclosures: '/legal/disclosures',
                  license: '/legal/license-agreement',
                };
                
                return (
                  <div key={type} className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      {accepted ? (
                        <span className="text-slate-400 flex-shrink-0">•</span>
                      ) : (
                        <Circle className="w-5 h-5 text-slate-700" />
                      )}
                      <span className="font-medium text-slate-900">{labels[type]}</span>
                    </div>
                    <Link 
                      href={urls[type]} 
                      target="_blank"
                      className="text-brand-blue-600 hover:underline text-sm"
                    >
                      Read Agreement
                    </Link>
                  </div>
                );
              })}
            </div>

            <LicenseeOnboardingForm 
              userId={user.id}
              userEmail={user.email}
              userName={user.user_metadata?.full_name || user.user_metadata?.name}
              organizationId={org?.id}
              requiredAgreements={requiredAgreements}
              acceptedAgreements={acceptedTypes}
            />
          </div>
        )}

        {(currentStep === 1 || (currentStep === 0 && allAgreementsAccepted)) && (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Organization Profile</h2>
            <p className="text-slate-700 mb-6">
              Complete your organization details to finish setup.
            </p>
            <p className="text-slate-700">Please contact support to complete your organization profile setup.</p>
          </div>
        )}
      </div>
    </div>
  );
}
