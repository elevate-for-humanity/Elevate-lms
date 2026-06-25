export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Lock,
  FileCheck,
  AlertTriangle,
  Building2,
  Scale,
  ClipboardCheck,
  ArrowRight,
CheckCircle, } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'Enterprise Source-Use Access | Elevate Workforce OS',
  description:
    'Enterprise source-use access for organizations requiring internal operation of the Workforce OS.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/enterprise',
  },
};

const requirements = [
  'Established enterprise with verifiable operational history',
  'Dedicated technical team for deployment and maintenance',
  'Compliance with security audit requirements',
  'Agreement to usage restrictions and audit rights',
  'Annual maintenance and security update obligations',
];

const restrictions = [
  'No resale or redistribution of source code',
  'No rebranding as competing product',
  'No credential authority transfer',
  'No sublicensing without explicit approval',
  'Mandatory security patch application within 30 days',
  'Annual compliance audit participation',
];

const includedItems = [
  'Full source code access under enterprise license',
  'Deployment documentation and architecture guides',
  'Security configuration templates',
  'Initial implementation support (40 hours)',
  'Annual security updates and patches',
  'Quarterly compliance review calls',
];

export default async function EnterprisePage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('system_settings').select('*').limit(50);

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Enterprise Access' }]} />
      <div className="max-w-7xl mx-auto px-4 pb-2">
        <p className="text-sm text-slate-600 font-medium">Part of the <a href="/platform" className="text-brand-red-600 hover:underline">Elevate Workforce Operating System</a></p>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Building2 className="w-4 h-4" /> Enterprise License
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">Enterprise Source-Use Access</h1>
          <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
            For qualified enterprises that need to operate the Workforce OS internally under strict contractual and security controls.
          </p>
        </div>
      </section>

      {/* How it differs from Managed */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-10">Enterprise vs. Managed</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Server className="w-6 h-6 text-brand-red-600" /> Managed Platform
              </h3>
              <ul className="space-y-3 text-slate-800">
                <li className="flex items-start gap-2"><span className="text-slate-400 flex-shrink-0">•</span> We host, operate, and update it</li>
                <li className="flex items-start gap-2"><span className="text-slate-400 flex-shrink-0">•</span> Zero engineering burden</li>
                <li className="flex items-start gap-2"><span className="text-slate-400 flex-shrink-0">•</span> Monthly subscription pricing</li>
                <li className="flex items-start gap-2"><span className="text-slate-400 flex-shrink-0">•</span> Best for most organizations</li>
              </ul>
              <Link href="/platform/managed" className="mt-6 inline-flex items-center gap-1 text-brand-red-600 font-semibold hover:underline">
                View Managed Platform <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-slate-900 rounded-xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-400" /> Enterprise Source-Use
              </h3>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start gap-2"><Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" /> You deploy and operate internally</li>
                <li className="flex items-start gap-2"><Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" /> Requires dedicated technical team</li>
                <li className="flex items-start gap-2"><Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" /> Annual license + audit obligations</li>
                <li className="flex items-start gap-2"><Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" /> For large enterprises only</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What's included + Requirements */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6">What&apos;s Included</h3>
              <ul className="space-y-3">
                {includedItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-800">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Requirements</h3>
              <ul className="space-y-3">
                {requirements.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-800">
                    <Shield className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Restrictions */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-10">Usage Restrictions</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8">
            <ul className="space-y-3">
              {restrictions.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Request Enterprise Access</h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Enterprise source-use access requires qualification review. Contact our team to begin the process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store/licenses/source-use" className="px-8 py-4 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors">
              View Enterprise License
            </Link>
            <Link href="/store/licenses" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
              Compare All Licenses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Server(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>
    </svg>
  );
}
