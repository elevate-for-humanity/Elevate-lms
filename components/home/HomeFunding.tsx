import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarDays, ClipboardList } from 'lucide-react';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';


export function HomeFunding() {
  return (
    <section className="border-t border-slate-100 bg-slate-50 px-4 py-16 sm:py-20" aria-labelledby="funding-heading">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="relative min-h-[340px] overflow-hidden rounded-3xl sm:min-h-[400px]">
          <Image
            src="/images/pages/funding-hero.webp"
            alt="Advisor helping a student understand career training and funding options"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 48vw"
            loading="lazy"
          />
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Paying for Training</p>
          <h2 id="funding-heading" className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Not sure how you will pay? Start here.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-700">
            Some students may qualify for workforce funding, employer-supported training, grants, or other assistance. Others choose self-pay. We help you understand which route may fit before you commit to a program.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">Workforce funding</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Programs such as WIOA or Indiana workforce funding may be available when you and the selected program meet the responsible agency&apos;s requirements.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-black text-slate-950">Self-pay & employer options</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">If public funding is not the right fit, ask about payment options and eligible employer-based training arrangements.</p>
            </div>
          </div>

          <div className="mt-7 rounded-3xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-widest text-orange-800">Using WorkOne?</p>
            <h3 className="mt-2 text-2xl font-black text-slate-950">Complete your orientation, then connect it to Elevate.</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Schedule the official Indianapolis WorkOne orientation, then complete Elevate&apos;s funding intake so we know where you are in the process.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={WORKONE_INDY_BOOKING_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-black text-white hover:bg-orange-700">
                <CalendarDays className="h-5 w-5" /> Schedule WorkOne Orientation
              </a>
              <Link href="/funding/workone-intake" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-50">
                <ClipboardList className="h-5 w-5" /> Start Elevate Funding Intake
              </Link>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/check-eligibility" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 text-base font-extrabold text-white hover:bg-brand-red-700">
              Check My Options <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/funding" className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-7 py-4 text-base font-extrabold text-slate-900 hover:bg-slate-50">
              Learn About Funding
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
