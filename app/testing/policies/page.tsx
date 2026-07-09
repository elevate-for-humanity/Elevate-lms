import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Testing Policies | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Testing center policies, procedures, and requirements.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/testing/policies' },
};

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <FileText className="w-4 h-4" /> Policies
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">Testing Center Policies</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">Policies and procedures for our testing center.</p>
        </div>
      </section>
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 prose">
          <h2>Testing Policies</h2>
          <p>Please review our testing center policies before scheduling your exam.</p>
          <h3>ID Requirements</h3>
          <p>Valid government-issued photo ID is required for all exams.</p>
          <h3>Rescheduling</h3>
          <p>Exams may be rescheduled with 24 hours notice.</p>
          <h3>No-Show Policy</h3>
          <p>No-shows may forfeit their exam fee.</p>
        </div>
      </section>
    </div>
  );
}
