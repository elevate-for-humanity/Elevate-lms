import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, Building, Briefcase, Circle, } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employer Onboarding | Elevate For Humanity',
  description: 'Complete your employer onboarding process.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const steps = [
  { title: 'Company Profile', description: 'Complete your company information', icon: Building, status: 'complete' },
  { title: 'Hiring Needs', description: 'Tell us about your workforce needs', icon: Briefcase, status: 'current' },
  { title: 'Portal Access', description: 'Get access to the employer portal', icon: FileText, status: 'pending' },
  { title: 'Start Hiring', description: 'Connect with qualified candidates', icon: Circle, status: 'pending' },
];

export default async function EmployerOnboardingPage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/onboarding/employer');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Onboarding' }, { label: 'Employer' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employer Onboarding</h1>
        <p className="text-gray-600 mb-8">Complete these steps to start hiring from our talent pool.</p>

        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {steps.map((step, i) => (
            <div key={i} className="p-6 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step.status === 'complete' ? 'bg-green-100' : step.status === 'current' ? 'bg-brand-blue-100' : 'bg-gray-100'
              }`}>
                {step.status === 'complete' ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
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
                <Link href="/onboarding/employer/hiring-needs" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
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
