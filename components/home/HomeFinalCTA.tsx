import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const FINAL_CTA_IMAGE = '/images/pages/apply-hero.webp';

export function HomeFinalCTA() {
  return (
    <section className="bg-white px-4 py-14 sm:py-18" aria-labelledby="final-cta-heading">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl lg:grid-cols-[1fr_1fr]">
        <div className="relative min-h-[300px] sm:min-h-[400px]">
          <Image
            src={FINAL_CTA_IMAGE}
            alt="Student beginning an Elevate for Humanity career training application"
            fill
            loading="lazy"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-red-300">Ready for your next step?</p>
          <h2 id="final-cta-heading" className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            Tell us what you want to do. We&apos;ll help you find the right path.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            Apply for training, explore apprenticeship options, check possible funding routes, or talk with our team before you decide. You do not have to figure it out alone.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 text-sm font-black text-white hover:bg-brand-red-700">
              Start My Application <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/check-eligibility" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/60 px-6 py-3 text-sm font-black text-white hover:bg-white/10">
              Check My Options
            </Link>
          </div>

          <div className="mt-7 flex flex-col gap-2 text-sm text-slate-200 sm:flex-row sm:flex-wrap sm:items-center">
            <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 font-black text-white hover:text-red-200">
              <Phone className="h-4 w-4" aria-hidden="true" /> {PLATFORM_DEFAULTS.supportPhone}
            </a>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>Call or text Mon–Fri, 9am–5pm ET</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <Link href="/contact" className="font-bold text-white underline underline-offset-4 hover:text-red-200">Send a message</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
