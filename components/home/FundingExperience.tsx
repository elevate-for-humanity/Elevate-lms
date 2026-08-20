'use client';

import Link from 'next/link';
import { Building2, CheckCircle2, CreditCard, DollarSign, GraduationCap, ShieldCheck } from 'lucide-react';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

interface FundingExperienceProps {
  className?: string;
}

const pathways = [
  {
    icon: Building2,
    title: 'WIOA / WorkOne review',
    text: 'WIOA may support an eligible participant in an eligible program when the applicable workforce agency approves the training and provides the required authorization.',
    href: '/funding/wioa',
  },
  {
    icon: GraduationCap,
    title: 'Workforce Ready Grant review',
    text: 'WRG may support qualifying Indiana participants in qualifying programs under current state requirements and award limits.',
    href: '/funding/wrg',
  },
  {
    icon: CreditCard,
    title: 'Self-pay and documented alternatives',
    text: 'When public funding is not approved, review the published program price and any payment or employer option that is actually available for that enrollment.',
    href: '/funding',
  },
] as const;

export function FundingExperience({ className = '' }: FundingExperienceProps) {
  return (
    <section className={`py-20 bg-white ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-sm font-semibold">
            <DollarSign className="w-4 h-4" /> Funding guidance
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4">
            Confirm the program, participant, and authorization
          </h2>
          <p className="text-slate-600 mt-4 leading-relaxed">
            Funding is not guaranteed by a website screening result. Eligibility, approved costs,
            available funds, and authorization are determined by the responsible funding source for
            the exact participant and program.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {pathways.map((pathway) => (
            <Link key={pathway.title} href={pathway.href} className="rounded-xl border border-slate-200 p-6 hover:border-brand-red-300 transition-colors">
              <pathway.icon className="w-6 h-6 text-brand-red-600" />
              <h3 className="font-bold text-slate-900 text-lg mt-4">{pathway.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{pathway.text}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-slate-950 text-white p-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 flex-none mt-0.5" />
            <div>
              <h3 className="text-xl font-bold">Public funding claims are program-specific</h3>
              <p className="text-slate-300 text-sm leading-relaxed mt-2">
                The programs below are the records currently permitted by Elevate&apos;s canonical
                registry to display public workforce-funding labels. Inclusion does not establish an
                individual participant&apos;s eligibility or award.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="rounded-xl border border-white/15 bg-white/5 p-5 hover:bg-white/10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-none mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white">{program.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed mt-1">{program.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/apply" className="inline-flex items-center justify-center px-7 py-3.5 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold rounded-lg">
            Start funding and enrollment review
          </Link>
        </div>
      </div>
    </section>
  );
}
