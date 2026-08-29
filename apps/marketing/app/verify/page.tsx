import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, FileCheck, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Credentials,
  description: 'Verify credentials and certificates earned through Elevate for Humanity workforce programs.',
};

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ShieldCheck className="w-12 h-12 mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Verify Credentials</h1>
          <p className="text-xl text-blue-100">Verify credentials earned through Elevate for Humanity programs.</p>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How to Verify a Credential</h2>
            <p className="text-slate-600 mb-6">If you received a credential from Elevate for Humanity, you can verify it by:</p>
            <ol className="space-y-3 text-slate-700">
              <li className="flex gap-3"><span className="font-bold">1.</span> Contact our office at <a href="mailto:info@elevateforhumanity.org" className="text-brand-blue-600">info@elevateforhumanity.org</a></li>
              <li className="flex gap-3"><span className="font-bold">2.</span> Provide your full name and the program you completed</li>
              <li className="flex gap-3"><span className="font-bold">3.</span> Include your certificate number if available</li>
              <li className="flex gap-3"><span className="font-bold">4.</span> We will verify your credential within 1-2 business days</li>
            </ol>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600">For DOL-registered apprenticeship certificates, you can also verify at the <a href="https://www.apprenticeship.gov/" target="_blank" rel="noopener" className="text-brand-blue-600 underline">Department of Labor&apos;s Apprenticeship.gov</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
