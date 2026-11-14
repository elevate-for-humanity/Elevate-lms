import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ShieldCheck, Zap, FileText, ArrowRight } from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Agency Template Autofill',
  description: 'Instantly prefill any state or federal agency form from your verified organization profile.',
};

const FEATURES = [
  'One-click prefill from verified org profile',
  'Supports PDF, DOCX, and OCR-scanned forms',
  'Field confidence scoring — high/medium/low',
  'Manual override for any field before export',
  'Saves approved values for reuse across forms',
  'Works with all state and federal agency templates',
  'EIN, UEI, CAGE, SAM status, address, signatory',
  'Full audit trail on every prefill action',
];

export default function AgencyAutofillPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Add-ons', href: '/store/add-ons' }, { label: 'Agency Template Autofill' }]} />
      </div>
      <section className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Zap className="w-3.5 h-3.5" /> Operations & Compliance Automation
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Agency Template Autofill</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
            Stop re-entering your EIN, UEI, CAGE code, and address on every form.
            Upload any agency template and fields map to your verified org profile automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={getAdminUrl("/contracts")} className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold rounded-lg transition-colors">
              Open Contracts <ArrowRight className="w-4 h-4" />
            </a>
            <a href={getAdminUrl("/settings/organization-profile")} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors">
              Set Up Org Profile
            </a>
          </div>
        </div>
      </section>
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">What's included</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                <span className="w-4 h-4 rounded-full bg-blue-600 inline-block flex-shrink-0 mt-0.5 shrink-0" aria-hidden="true" />
                <span className="text-sm text-slate-700">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Included with your Elevate license</h2>
          <p className="text-slate-500 text-sm mb-6">Open the contracts module to upload your first template.</p>
          <a href={getAdminUrl("/contracts")} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors">
            Upload a Template <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
