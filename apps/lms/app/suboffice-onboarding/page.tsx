import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { CheckCircle, Building, Users, FileText, Shield, Headphones } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suboffice Onboarding | Elevate for Humanity',
  description: 'Welcome to the Elevate partner network. Complete your suboffice onboarding.',
};

const onboardingSteps = [
  { step: 1, title: 'Account Setup', description: 'Create your suboffice admin account and set up two-factor authentication.', icon: Users, status: 'pending' },
  { step: 2, title: 'Organization Profile', description: 'Add your organization details, logo, and contact information.', icon: Building, status: 'pending' },
  { step: 3, title: 'Agreement Signing', description: 'Review and sign the suboffice partnership agreement.', icon: FileText, status: 'pending' },
  { step: 4, title: 'Compliance Training', description: 'Complete required compliance and data security training modules.', icon: Shield, status: 'pending' },
  { step: 5, title: 'Support Access', description: 'Get set up with our partner support channel and resources.', icon: Headphones, status: 'pending' },
];

export default function SubofficeOnboardingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Partner Portal', href: '/partners' }, { label: 'Onboarding' }]} />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4">Welcome to the Elevate Partner Network</h1>
          <p className="text-blue-100">
            Complete these onboarding steps to get started with your suboffice partnership.
          </p>
        </div>
      </section>

      {/* Progress */}
      <section className="py-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Onboarding Progress</span>
            <span className="text-sm font-bold text-brand-blue-600">0 of 5 complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="h-full w-0 bg-brand-blue-600 rounded-full transition-all" />
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-4">
            {onboardingSteps.map((item) => (
              <div key={item.step} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-500">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <item.icon className="w-6 h-6 text-brand-blue-600 mt-1" />
                        <div>
                          <h3 className="text-lg font-bold text-black">{item.title}</h3>
                          <p className="text-slate-600 mt-1">{item.description}</p>
                        </div>
                      </div>
                      <button className="bg-brand-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-brand-blue-700 transition-colors">
                        Start
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-lg font-bold text-black mb-2">Need Assistance?</h2>
          <p className="text-slate-600 mb-4">
            Our partner support team is here to help you through the onboarding process.
          </p>
          <Link href="/contact?topic=partner" className="inline-block bg-brand-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-brand-blue-700">
            Contact Partner Support
          </Link>
        </div>
      </section>
    </div>
  );
}
