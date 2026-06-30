'use client';

import { hero as heroTokens } from '@/lib/page-design-tokens';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Lock, BookOpen, ClipboardList, FileText, PenLine } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu';

interface Props {
  isApproved?: boolean;
  basePath?: string;
  breadcrumbLabel?: string;
}

const requirements = [
  { title: "Workers' Compensation", desc: "Required for all apprentices. If you don't carry it yet, we can help you understand your options." },
  { title: 'Pay Structure', desc: 'Apprentices must be paid at least minimum wage ($7.25/hr). Hourly, commission, or hybrid — your choice.' },
  { title: 'Supervising Cosmetologist', desc: 'Designate a licensed Indiana cosmetologist to supervise apprentices, verify hours, and sign off on competencies.' },
  { title: 'Valid Salon License', desc: 'Your salon must hold a valid Indiana salon license and be in good standing with the IPLA.' },
  { title: 'Video Site Visit', desc: 'A 15-minute Zoom walkthrough of your salon before final approval.' },
  { title: 'DOL RAPIDS Listing', desc: 'Approved salons are listed on the U.S. Department of Labor RAPIDS system as registered worksites.' },
];

const timeline = [
  { n: '1', title: 'Apply Online', time: 'Day 1', desc: 'Complete the partner application — salon license, supervisor info, and salon photos.' },
  { n: '2', title: 'License Verification', time: 'Days 1–3', desc: 'We verify your salon license and supervisor credentials with IPLA.' },
  { n: '3', title: 'Video Site Visit', time: 'Days 3–5', desc: '15-minute Zoom walkthrough of your salon.' },
  { n: '4', title: 'MOU Signing', time: 'Days 5–6', desc: 'Review and sign the Memorandum of Understanding.' },
  { n: '5', title: 'Approved', time: '~1 Week', desc: 'Your salon is approved and listed as a registered DOL worksite.' },
];

const faqs = [
  { q: 'How much does it cost to become a host salon?', a: 'No fee. You pay the apprentice a wage. Elevate handles program administration, theory training, and DOL compliance.' },
  { q: "Do I need workers' comp insurance?", a: "Yes. Workers' compensation is required for all apprentices." },
  { q: 'How are apprentices paid?', a: 'At least minimum wage ($7.25/hr). You choose the model — hourly, commission, or hybrid.' },
  { q: 'How long does the apprenticeship last?', a: 'Apprentices complete 2,000 hours of on-the-job training. Full-time is about 1 year.' },
  { q: 'Can apprentices use an ITIN instead of SSN?', a: 'Yes. We accept ITIN for enrollment in place of a Social Security Number.' },
  { q: 'What happens after the apprentice finishes?', a: 'They sit for the Indiana State Board cosmetology license exam. Many salons hire their apprentices as licensed cosmetologists.' },
];

export default function CosmetologyPartnerPageClient({
  isApproved = false,
  basePath = '/partners/cosmetology-apprenticeship',
  breadcrumbLabel = 'Cosmetology Apprenticeship',
}: Props) {
  const onboarding = [
    {
      n: '1',
      icon: BookOpen,
      label: 'Read the Partner Handbook',
      desc: 'Covers responsibilities, supervision requirements, hour tracking, and compensation rules.',
      href: `/login?redirect=${encodeURIComponent(`${basePath}/handbook`)}`,
    },
    {
      n: '2',
      icon: ClipboardList,
      label: 'Acknowledge Policies',
      desc: 'Review and acknowledge program policies, wage requirements, and supervision standards.',
      href: `/login?redirect=${encodeURIComponent(`${basePath}/policy-acknowledgment`)}`,
    },
    {
      n: '3',
      icon: FileText,
      label: 'Complete Required Forms',
      desc: "Submit your W-9, workers' comp certificate, and supervisor license documentation.",
      href: `/login?redirect=${encodeURIComponent(`${basePath}/forms`)}`,
    },
    {
      n: '4',
      icon: PenLine,
      label: 'Sign the MOU',
      desc: 'Digitally sign the Memorandum of Understanding to finalize your partnership.',
      href: `/login?redirect=${encodeURIComponent(`${basePath}/sign-mou`)}`,
    },
    {
      n: '5',
      icon: FileText,
      label: 'Upload Required Documents',
      desc: "Upload your salon license, workers' comp insurance certificate, and supervising cosmetologist license. Keep these current as required by the DOL.",
      href: `/login?redirect=${encodeURIComponent(`${basePath}/documents`)}`,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Partners', href: '/partners' }, { label: breadcrumbLabel }]} />
      </div>

      {/* Hero image — no text overlay, no gradient wash per design standard */}
      <div className={`${heroTokens.imageWrap} w-full overflow-hidden`}>
        {/* IMAGE-CONTRACT: allow raw img because legacy markup */}
        <img
          src="/images/pages/cosmetology-hero.webp"
          alt="Licensed Indiana cosmetology salon ready to host apprentices"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Hero content — below image */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <span className="inline-block bg-purple-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">DOL Registered Apprenticeship</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">Indiana Cosmetology Apprenticeship</h1>
          <p className="text-slate-600 text-lg max-w-xl mb-6">Host an apprentice. Grow your salon. Build the next generation of licensed cosmetologists.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={`${basePath}/apply`} className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-xl font-extrabold text-base hover:bg-purple-700 transition-colors">Apply as a Host Salon <ArrowRight className="w-5 h-5 ml-2" /></Link>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-4 border border-slate-300 text-slate-700 rounded-xl font-extrabold text-base hover:bg-slate-50 transition-colors">Schedule a Call</a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Program Overview</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">How the Program Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Apply & Get Approved', desc: 'Submit your application, complete a Zoom site visit, and sign the MOU. Approval takes about 1 week.' },
              { n: '2', title: 'Host an Apprentice', desc: 'We match qualified apprentices to your salon. They complete 2,000 hours of on-the-job training under your supervision.' },
              { n: '3', title: 'Grow Your Team', desc: 'Apprentices complete theory through Elevate LMS, then sit for the Indiana State Board exam. You get a trained, licensed cosmetologist.' },
            ].map((s) => (
              <div key={s.n} className="text-center">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-purple-600 font-bold text-xl">{s.n}</span></div>
                <h3 className="font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Requirements</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">What Host Salons Need to Know</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {requirements.map((r) => (
              <div key={r.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{r.title}</h3>
                <p className="text-sm text-slate-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Timeline</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Approval Timeline</h2>
          <div className="space-y-5">
            {timeline.map((s) => (
              <div key={s.n} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0"><span className="text-purple-600 font-bold">{s.n}</span></div>
                <div>
                  <div className="flex items-center gap-3 mb-0.5">
                    <h3 className="font-bold text-slate-900 text-sm">{s.title}</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{s.time}</span>
                  </div>
                  <p className="text-sm text-slate-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-widest text-center mb-2">FAQ</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer font-semibold text-slate-900 text-sm hover:bg-slate-50 transition-colors">{f.q}</summary>
                <div className="px-5 pb-4 text-sm text-slate-600">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to Partner With Us?</h2>
          <p className="text-slate-300 text-sm mb-8">Join the Indiana Cosmetology Apprenticeship program and start developing talent for your salon.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`${basePath}/apply`} className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white rounded-xl font-extrabold text-base hover:bg-purple-700 transition-colors">Start Your Application <ArrowRight className="w-5 h-5 ml-2" /></Link>
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`} className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-slate-900 rounded-xl font-extrabold text-base hover:bg-white/10 transition-colors">{PLATFORM_DEFAULTS.supportPhone}</a>
          </div>
        </div>
      </section>

      {/* Onboarding — approved partners only */}
      {isApproved && (
        <section className="py-16 px-6 bg-slate-50 border-t border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-brand-green-600 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900">After Your Application Is Approved</h2>
            </div>
            <p className="text-sm text-slate-600 mb-5">Complete these five steps to receive your first apprentice placement.</p>
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 font-medium">These steps require a partner account. You will be prompted to log in.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {onboarding.map(({ n, icon: Icon, label, desc, href }) => (
                <Link key={n} href={href} className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-purple-400 hover:shadow-sm transition group">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-lg group-hover:bg-purple-600 group-hover:text-white transition">{n}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-purple-600" /><h3 className="font-bold text-slate-900 text-sm">{label}</h3></div>
                    <p className="text-xs text-slate-600">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
