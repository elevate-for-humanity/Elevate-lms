import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, CheckCircle, Award, ExternalLink } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config`;

export const metadata: Metadata = {
  title: `Credential Verification | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Verify blockchain-issued credentials and certificates. Instant, tamper-proof verification for employers and institutions.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/verification' },
};

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAgTCAwIDIwIEwgMTAgMjAgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmZmYwMDIiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Shield className="w-4 h-4" /> Blockchain Verified
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">Verify Credentials</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-10">
            Instantly verify any credential or certificate issued by {PLATFORM_DEFAULTS.orgName}. Blockchain-secured, tamper-proof verification.
          </p>
          <Link href="/certificates/verify/[certificateId]" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-4 rounded-xl transition-colors text-lg">
            Verify a Certificate
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">How Verification Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-brand-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Enter Certificate ID</h3>
              <p className="text-slate-600">Find the certificate ID on the credential document or ask the holder for their verification link.</p>
            </div>
            <div className="text-center">
              <div className="bg-brand-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Instant Check</h3>
              <p className="text-slate-600">Our system verifies the credential against the blockchain ledger in real-time.</p>
            </div>
            <div className="text-center">
              <div className="bg-brand-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-xl mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">View Results</h3>
              <p className="text-slate-600">See the credential holder, issue date, expiration, and issuing institution.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Why Blockchain Verification?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <CheckCircle className="w-10 h-10 text-brand-red-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Tamper-Proof</h3>
              <p className="text-slate-600 text-sm">Credentials cannot be altered or faked.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <Award className="w-10 h-10 text-brand-red-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Permanent Record</h3>
              <p className="text-slate-600 text-sm">Credentials exist forever on the blockchain.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <ExternalLink className="w-10 h-10 text-brand-red-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Instant</h3>
              <p className="text-slate-600 text-sm">Verify any credential in seconds.</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <Shield className="w-10 h-10 text-brand-red-600 mx-auto mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Secure</h3>
              <p className="text-slate-600 text-sm">Cryptographic verification ensures authenticity.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-red-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">Verify a Credential Today</h2>
          <p className="text-lg text-red-100 mb-8">Enter a certificate ID to verify its authenticity.</p>
          <Link href="/certificates/verify/[certificateId]" className="inline-block bg-white text-brand-red-700 font-bold px-8 py-4 rounded-xl hover:bg-red-50 transition-colors text-lg">
            Verify Now
          </Link>
        </div>
      </section>
    </div>
  );
}
