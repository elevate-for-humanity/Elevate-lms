export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { DollarSign, CheckCircle, ArrowRight } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Grants & Funding | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Learn about grants and funding options for workforce training.',
};

const GRANTS = [
  { title: 'WIOA Funding', desc: 'Federal workforce development funds for eligible individuals.' },
  { title: 'Workforce Ready Grant', desc: 'Indiana state grant covering full tuition for qualifying programs.' },
  { title: 'Employer Grants', desc: 'Grants for employers sponsoring employee training.' },
];

export default function GrantsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Grants & Funding</h1>
          <p className="text-xl text-blue-100">Financial support to help you get trained.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            {GRANTS.map((grant) => (
              <div key={grant.title} className="bg-white p-8 rounded-xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <DollarSign className="w-8 h-8 text-blue-600 shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">{grant.title}</h3>
                    <p className="text-slate-600">{grant.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <a href="/check-eligibility" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700">
              Check Eligibility <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

