import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Request Trial Access | Elevate Store',
  description: 'Request a guided trial of the Elevate Workforce Operating System. Your evaluation environment will be ready within 1 business day.',
};

export default function TrialPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Request Trial' }]} />
        </div>
      </div>

      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-4">Request Trial Access</h1>
          <p className="text-lg text-slate-800 mb-8">
            Trial environments are set up with your specific use case in mind.
            Submit a request and your evaluation environment will be ready within 1 business day.
          </p>

          <div className="bg-slate-50 rounded-xl p-8 mb-8 text-left">
            <h2 className="text-lg font-bold text-slate-900 mb-4">What you get</h2>
            <ul className="space-y-3 text-slate-800">
              <li className="flex items-start gap-2"><Clock className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" /> 14-day evaluation access</li>
              <li className="flex items-start gap-2"><Shield className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" /> Full platform functionality with demo data</li>
              <li className="flex items-start gap-2"><Shield className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" /> No credit card required</li>
              <li className="flex items-start gap-2"><Shield className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" /> Guided onboarding included</li>
            </ul>
          </div>

          <Link
            href="/contact?topic=trial"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors"
          >
            Request Trial Access <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600">
              Trial is optional. Most customers get started immediately via{' '}
              <Link href="/store/licenses" className="text-brand-red-600 font-medium hover:underline">licensing</Link>.
            </p>
          </div>

          <p className="mt-6 text-sm text-slate-600">
            Want to see the platform first? <Link href="/store/demo" className="text-brand-red-600 font-medium hover:underline">View guided tour →</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
