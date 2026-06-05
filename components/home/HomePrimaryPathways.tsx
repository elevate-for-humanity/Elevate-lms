/**
 * Four primary audience pathways — above-the-fold journey selection.
 */

import Link from 'next/link';
import { ArrowRight, GraduationCap, Landmark, Building2, Handshake } from 'lucide-react';

const PATHWAYS = [
  {
    headline: 'I Need Training',
    desc: 'Indiana high-demand career pathways — healthcare, trades, technology, and more.',
    href: '/programs',
    cta: 'Browse Programs',
    icon: GraduationCap,
    accent: 'border-brand-red-200 hover:border-brand-red-400',
    ctaClass: 'bg-brand-red-600 hover:bg-brand-red-700 text-white',
  },
  {
    headline: 'I Need Funding',
    desc: 'WIOA, Workforce Ready Grant, FSSA IMPACT, and apprenticeship earn-while-you-learn.',
    href: '/funding',
    cta: 'Check Funding',
    icon: Landmark,
    accent: 'border-brand-green-200 hover:border-brand-green-400',
    ctaClass: 'bg-brand-green-600 hover:bg-brand-green-700 text-white',
  },
  {
    headline: 'I Need Employees',
    desc: 'Hire credentialed graduates, sponsor apprentices, OJT wage reimbursement up to 50%.',
    href: '/employers',
    cta: 'Employer Hub',
    icon: Building2,
    accent: 'border-brand-blue-200 hover:border-brand-blue-400',
    ctaClass: 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white',
  },
  {
    headline: 'I Want to Partner',
    desc: 'Workforce agencies, training sites, credential partners, and community organizations.',
    href: '/partners',
    cta: 'Partner With Us',
    icon: Handshake,
    accent: 'border-purple-200 hover:border-purple-400',
    ctaClass: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
];

export function HomePrimaryPathways() {
  return (
    <section className="bg-white py-10 px-4 border-b border-slate-100" aria-labelledby="primary-pathways-heading">
      <div className="max-w-6xl mx-auto">
        <h2 id="primary-pathways-heading" className="sr-only">
          Choose your pathway
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PATHWAYS.map((path) => (
            <Link
              key={path.headline}
              href={path.href}
              className={`group flex flex-col rounded-2xl border-2 p-5 transition-all hover:shadow-md ${path.accent}`}
            >
              <path.icon className="w-8 h-8 text-slate-700 mb-3" aria-hidden />
              <h3 className="font-extrabold text-slate-900 text-base mb-2">{path.headline}</h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1 mb-4">{path.desc}</p>
              <span
                className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold ${path.ctaClass}`}
              >
                {path.cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
