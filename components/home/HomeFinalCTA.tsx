import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function HomeFinalCTA() {
  return (
    <section className="bg-white px-4 pb-8 sm:pb-12" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-6xl rounded-2xl bg-slate-950 px-5 py-7 text-white sm:px-8 sm:py-9">
        <h2 id="final-cta-heading" className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Ready to get started?</h2>
        <p className="mt-3 max-w-xl text-base leading-6 text-slate-200">Apply for training or talk with our team about your next step.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-red-700">Start my application <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          <Link href="/check-eligibility" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Check my options</Link>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <a href={`tel:${PLATFORM_DEFAULTS.mainPhone.replace(/[^0-9]/g, '')}`} className="inline-flex min-h-11 items-center gap-2 font-semibold text-white hover:text-red-200"><Phone className="h-4 w-4" aria-hidden="true" />{PLATFORM_DEFAULTS.mainPhone}</a>
          <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold text-white hover:text-red-200">Contact us</Link>
        </div>
      </div>
    </section>
  );
}
