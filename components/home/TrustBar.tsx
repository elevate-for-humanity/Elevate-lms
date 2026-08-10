'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface TrustBarProps {
  variant?: 'hero' | 'section' | 'full' | 'footer';
  className?: string;
}

const TRUST_ITEMS = [
  {
    label: 'Registered Apprenticeships',
    detail: 'Sponsor and program details are published by pathway.',
    href: '/approvals',
  },
  {
    label: 'Program-Specific Funding',
    detail: 'Funding labels are conditional on agency and participant approval.',
    href: '/funding',
  },
  {
    label: 'Credential Preparation',
    detail: 'Each program identifies the credential or license pathway it supports.',
    href: '/programs',
  },
  {
    label: 'Employer & Host-Site Network',
    detail: 'Apprenticeship placement and host-site relationships are shown where applicable.',
    href: '/partners/host-shops',
  },
  {
    label: 'Testing & Assessments',
    detail: 'Testing-center options are separated by exam and provider.',
    href: '/testing',
  },
  {
    label: 'Student Support',
    detail: 'Admissions and support contacts are available before and after enrollment.',
    href: '/contact',
  },
] as const;

function HeroTrustBar() {
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-label="Program verification links">
      {TRUST_ITEMS.slice(0, 4).map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + index * 0.08 }}
        >
          <Link
            href={item.href}
            className="inline-flex min-h-10 items-center rounded-full border border-white/35 bg-black/30 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-black/45"
          >
            {item.label}
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function FullTrustBar() {
  return (
    <section className="border-y border-slate-200 bg-white py-14" aria-labelledby="trust-bar-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto mb-9 max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-red-700">Clear, reviewable pathways</p>
          <h2 id="trust-bar-heading" className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Important claims link back to the page that explains them.
          </h2>
          <p className="mt-3 leading-7 text-slate-700">
            Funding, approvals, credentials, and partner relationships are program-specific. Review the applicable source before relying on a claim.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_ITEMS.map((item, index) => (
            <motion.article
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="font-bold text-slate-950">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
              <Link href={item.href} className="mt-4 inline-flex min-h-10 items-center text-sm font-bold text-brand-blue-800 underline underline-offset-4">
                Review details
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionTrustBar() {
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 py-7" aria-label="Verification shortcuts">
      {TRUST_ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="inline-flex min-h-10 items-center text-sm font-bold text-slate-800 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function FooterTrustBar() {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 py-4">
      {TRUST_ITEMS.slice(0, 4).map((item) => (
        <Link key={item.label} href={item.href} className="text-sm font-semibold text-slate-300 hover:text-white">
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function TrustBar({ variant = 'section', className = '' }: TrustBarProps) {
  if (variant === 'hero') {
    return <div className={className}><HeroTrustBar /></div>;
  }
  if (variant === 'full') return <FullTrustBar />;
  if (variant === 'footer') return <div className={className}><FooterTrustBar /></div>;
  return <div className={className}><SectionTrustBar /></div>;
}

export default TrustBar;
