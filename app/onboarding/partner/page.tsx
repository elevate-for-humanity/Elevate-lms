import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, FileText, Building, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Partner Onboarding | Elevate For Humanity',
  description: 'Complete your partner onboarding process.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const steps = [
  { title: 'Organization Profile', description: 'Complete your organization details', icon: Building, status: 'complete' },
  { title: 'MOU Agreement', description: 'Review and sign the memorandum of understanding', icon: FileText, status: 'current' },
  { title: 'Portal Training', description: 'Learn to use the partner portal', icon: Users, status: 'pending' },
  { title: 'Go Live', description: 'Start enrolling students', icon: CheckCircle, status: 'pending' },
];

export default async function PartnerOnboardingPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/partner');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding' }, { label: 'Partner' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Onboarding</h1>
        <p className="text-gray-600 mb-8">Complete these steps to become an active partner.</p>

        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {steps.map((step, i) => (
            <div key={i} className="p-6 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.status === 'complete' ? 'bg-green-100' : step.status === 'current' ? 'bg-brand-blue-100' : 'bg-gray-100'
              }`}>
                {step.status === 'complete' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : step.status === 'current' ? (
                  <Clock className="w-6 h-6 text-brand-blue-600" />
                ) : (
                  <step.icon className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
              {step.status === 'current' && (
                <Link href="/onboarding/mou" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
                  Continue
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
