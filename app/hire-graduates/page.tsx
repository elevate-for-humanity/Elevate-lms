import { Metadata } from 'next';
import { Users, Building, ArrowRight, CheckCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Hire Our Graduates | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Hire trained graduates from Elevate for Humanity workforce programs.',
};

const BENEFITS = [
  'Pre-screened, certified candidates',
  'Training in high-demand fields',
  'Ongoing support during transition',
  'Workforce development partnerships',
];

export default function HireGraduatesPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hire Our Graduates</h1>
          <p className="text-xl text-blue-100">Access a pipeline of trained, certified workers ready for your workforce.</p>
        </div>
      </section>
      
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">Why Hire Our Graduates?</h2>
            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-8 rounded-xl border border-slate-200">
            <h2 className="text-2xl font-bold mb-4">Post a Job</h2>
            <p className="text-slate-600 mb-6">Connect with our graduates directly.</p>
            <a href="/employers/post-job" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
              Post a Position <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
