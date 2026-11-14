'use client';

import Link from 'next/link';
import { ArrowRight, FileCheck2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export function FundingQuickCheck() {
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 md:p-12 bg-white shadow-sm border border-slate-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-2xl mb-4">
              <FileCheck2 className="w-7 h-7 text-slate-700" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Funding eligibility requires an official review</h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto leading-relaxed">
              Elevate does not calculate or predict government funding eligibility from ZIP code,
              income, employment status, or other answers on a marketing widget. The responsible
              agency determines participant eligibility, and the exact program must also qualify.
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-800 flex-none mt-0.5" />
            <p className="text-sm text-amber-950 leading-relaxed">
              A screening conversation, application, or website result is not an award. Elevate
              should treat an enrollment as third-party funded only after the responsible source
              provides documented authorization for the participant and program.
            </p>
          </div>

          <div className="mt-8">
            <h3 className="font-bold text-slate-900">Programs currently allowed to display public workforce-funding labels</h3>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
                <Link key={program.slug} href={`/programs/${program.slug}`} className="rounded-xl border border-slate-200 p-4 hover:border-brand-red-300 transition-colors">
                  <p className="font-bold text-slate-900 text-sm">{program.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{program.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-slate-950 text-white font-bold px-6 py-3 rounded-lg">
              Start Application <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/funding" className="inline-flex items-center justify-center border border-slate-300 text-slate-900 font-bold px-6 py-3 rounded-lg">
              Review Funding Requirements
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default FundingQuickCheck;
