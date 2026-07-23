import { Metadata } from 'next';
import Link from 'next/link';
import { Award, CheckCircle, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Verify Credential',
  keywords: ["credential", "certification", "verify certificate", "graduates"], description: 'Verify credentials issued by Elevate for Humanity.',
};

export default function CredentialPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Verify a Credential</h1>
          <p className="text-blue-200">Verify credentials issued by Elevate for Humanity.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Credential Verification</h2>
            <div className="bg-slate-50 rounded-xl p-6 mb-6">
              <p className="text-slate-600 text-center">Enter a credential ID to verify its authenticity.</p>
            </div>
            <form className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">Credential ID</label><input type="text" placeholder="Enter credential ID" className="w-full border rounded-lg px-4 py-2" /></div>
              <button type="submit" className="w-full bg-brand-blue-600 text-white font-bold py-3 rounded-lg hover:bg-brand-blue-700 flex items-center justify-center gap-2"><Search className="w-5 h-5" />Verify</button>
            </form>
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-bold mb-4">Credentials We Issue</h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" />Completion certificates</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" />Industry certifications</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> apprenticeship credentials</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
