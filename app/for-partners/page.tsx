import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, CheckCircle, Building2, Users, FileText, BarChart3 } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'For Partners',
  description: `Partner with ${PLATFORM_DEFAULTS.orgName} as a training provider, employer, workforce agency, or government entity.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners' },
  robots: { index: false, follow: false },
};

const tracks = [
  { icon: Building2, title: 'Training Providers', desc: 'Deliver Elevate-approved programs under your brand. We handle ETPL listing, WIOA compliance, and participant funding.', href: '/for-providers', cta: 'See Details', color: 'purple' },
  { icon: Users, title: 'Employers & Sponsors', desc: 'Hire graduates or host registered apprentices. We match you with qualified candidates and handle DOL RAPIDS paperwork.', href: '/for-employers', cta: 'See Details', color: 'green' },
  { icon: FileText, title: 'Workforce Agencies', desc: 'Refer WIOA, FSSA, and WRG participants to Elevate programs. We handle enrollment, compliance, and outcome reporting.', href: '/for-agencies', cta: 'See Details', color: 'blue' },
  { icon: BarChart3, title: 'Government & Oversight', desc: 'Access ETPL performance data, WIOA metrics, and apprenticeship compliance documentation.', href: '/federal-compliance', cta: 'View Compliance', color: 'slate' },
];

const benefits = [
  'Compliance-ready MOU and partnership agreements',
  'Shared participant outcome data and reporting',
  'ETPL listing and WIOA funding coordination',
  'DOL RAPIDS apprenticeship registration support',
  'Co-marketing and referral network access',
  'Dedicated partner success contact',
];

export default function ForPartnersPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b"><div className="max-w-6xl mx-auto px-4 py-3"><Breadcrumbs items={[{ label: 'For Partners' }]} /></div></div>
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">Partner Network</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-5">Build the Workforce Together</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">Elevate connects training providers, employers, workforce agencies, and government entities into a single compliance-ready system.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/partners" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">Become a Partner</Link>
            <Link href="/partner-operating-model" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">View Operating Model</Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Partner Types</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Choose Your Partnership Track</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {tracks.map(({ icon: Icon, title, desc, href, cta }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3 mb-3"><Icon className="w-6 h-6 text-purple-600" /><h3 className="font-extrabold text-slate-900 text-base">{title}</h3></div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{desc}</p>
                <Link href={href} className="inline-flex items-center gap-1.5 font-bold text-xs text-purple-700 hover:underline">{cta} <ArrowRight className="w-3.5 h-3.5" /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest text-center mb-2">What You Get</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Partner Benefits</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                <CheckCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest mb-2">Operating Model</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Understand How It Works</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto mb-6">Every partner type has defined roles, responsibilities, and compliance requirements. Review the full operating model before applying.</p>
          <Link href="/partner-operating-model" className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-3.5 rounded-lg hover:bg-slate-800 transition-colors text-sm">View Partner Operating Model <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>
      <section className="bg-purple-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to Partner with Elevate?</h2>
          <p className="text-purple-100 text-sm mb-8">Submit a partnership inquiry and our team will reach out within 2 business days.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/partners" className="bg-white text-purple-700 font-bold px-8 py-3.5 rounded-lg hover:bg-purple-50 transition-colors text-sm">Apply to Partner</Link>
            <Link href="/contact" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
