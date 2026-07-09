import { Metadata } from 'next';
import { CheckCircle, DollarSign, Users, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Check Eligibility | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Check if you qualify for workforce training funding and programs.',
};

const ELIGIBILITY_TYPES = [
  { icon: DollarSign, title: 'WIOA Funding', desc: 'Workforce Innovation and Opportunity Act funding for qualifying individuals.' },
  { icon: Users, title: 'Workforce Ready Grant', desc: 'Indiana Workforce Ready Grant covers tuition for eligible programs.' },
  { icon: CheckCircle, title: 'Employer Sponsorship', desc: 'Some employers sponsor employee training and certifications.' },
];

export default function CheckEligibilityPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Check Your Eligibility</h1>
          <p className="text-xl text-blue-100">Find out what funding and support you qualify for.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {ELIGIBILITY_TYPES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-8 rounded-xl border border-slate-200">
                <Icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-slate-600 mb-4">{desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <a href="/contact" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700">
              Get Started <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

