import { Metadata } from 'next';
import Link from 'next/link';
import { Award, Shield, CheckCircle, FileText, Clock, BarChart3, Globe, Download, Link2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Credential Engine | Digital Certification & Verification',
  description: 'Issue, manage, and verify digital credentials and certifications. Blockchain-verified credentials with instant employer verification.',
};

const features = [
  {
    icon: Shield,
    title: 'Blockchain Verified',
    description: 'Credentials are cryptographically signed and stored on blockchain for tamper-proof verification.',
  },
  {
    icon: Globe,
    title: 'Instant Verification',
    description: 'Employers verify credentials in seconds with QR codes or direct URL. No more paper certificates.',
  },
  {
    icon: Download,
    title: 'Digital Wallets',
    description: 'Students receive credentials in digital wallets. Share with employers instantly.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track credential issuance, verification rates, and graduate outcomes.',
  },
  {
    icon: FileText,
    title: 'Rich Metadata',
    description: 'Include skills, competencies, completion dates, and credential criteria.',
  },
  {
    icon: Clock,
    title: 'Expiration Management',
    description: 'Automatic renewal reminders and expiration tracking for time-limited credentials.',
  },
];

const credentials = [
  { name: 'NHA Certifications', count: '2,847' },
  { name: 'State Licenses', count: '1,923' },
  { name: 'OSHA Cards', count: '4,521' },
  { name: 'EPA 608 Universal', count: '892' },
  { name: 'CareerSafe', count: '3,104' },
  { name: 'Industry Certs', count: '2,156' },
];

export default function CredentialEnginePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-orange-900 to-red-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500 rounded-full filter blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-400/30 rounded-full text-sm mb-6">
              <Award className="w-4 h-4" />
              Digital Credential Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Credential Engine
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Issue, manage, and verify digital credentials and certifications. 
              Blockchain-verified credentials with instant employer verification.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/admin/credentials" className="px-8 py-4 bg-amber-600 rounded-lg font-semibold hover:bg-amber-500 transition">
                Manage Credentials
              </Link>
              <Link href="/contact" className="px-8 py-4 bg-white/10 border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition">
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Modern Credential Management</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Replace paper certificates with verifiable digital credentials that employers trust.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-200 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                    <Icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Credentials Issued</h2>
            <p className="text-slate-600">Track credential volume across all programs</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {credentials.map((cred) => (
              <div key={cred.name} className="bg-white rounded-xl border border-slate-200 p-6 text-center">
                <p className="text-3xl font-bold text-amber-600">{cred.count}</p>
                <p className="text-sm text-slate-500 mt-2">{cred.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold mb-2">1. Issue Credential</h3>
              <p className="text-sm text-slate-600">Admin issues credential upon program completion. Student receives digital wallet notification.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Link2 className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold mb-2">2. Share with Employer</h3>
              <p className="text-sm text-slate-600">Student shares credential URL or QR code. Employer clicks to verify authenticity.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="font-bold mb-2">3. Instant Verification</h3>
              <p className="text-sm text-slate-600">Employer sees verified credential details including issue date, expiry, and criteria met.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Issue Verifiable Credentials</h2>
          <p className="text-xl text-amber-100 mb-8">
            Replace paper certificates with blockchain-verified digital credentials.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/admin/credentials" className="px-8 py-4 bg-white text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition">
              Manage Credentials
            </Link>
            <Link href="/platform/enterprise" className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Enterprise Solutions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
