import { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { Shield, Award, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: `Verify Credentials | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Verify professional credentials and certifications issued by Elevate for Humanity.',
};

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 text-brand-red-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Verify Credentials</h1>
          <p className="text-xl text-slate-300">Verify professional credentials and certifications</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Enter Credential Details</h2>
          <form className="space-y-4">
            <input type="text" placeholder="Credential ID (if known)" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
            <input type="text" placeholder="Graduate Name" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
            <input type="email" placeholder="Your Email" className="w-full px-4 py-3 border border-slate-300 rounded-xl" />
            <button type="submit" className="w-full py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors">
              Verify Credential
            </button>
          </form>
        </div>
      </section>

      <section className="py-16 bg-slate-50 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Need to Verify a Certificate?</h2>
          <p className="text-slate-600 mb-6">Contact us with the graduate's name and credential type.</p>
          <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-xl transition-colors">
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
}
