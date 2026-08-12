/**
 * HomeFinalCTA
 *
 * Strong workforce transformation close.
 * Primary: Apply. Secondary: Check Eligibility.
 * Phone number for direct contact.
 */

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function HomeFinalCTA() {
  return (
    <section
      className="relative overflow-hidden bg-brand-red-700 px-4 py-8 sm:py-10"
      aria-labelledby="final-cta-heading"
    >
      <div className="relative mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-brand-red-800 shadow-xl lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[220px] lg:min-h-[320px]">
          <Image
            src="/images/pages/workforce-training.webp"
            alt="Elevate for Humanity workforce training and career advancement"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" aria-hidden="true" />
        </div>

        <div className="flex flex-col justify-center px-6 py-7 text-center sm:px-8 lg:px-10 lg:text-left">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white">
            Ready to start?
          </p>
          <h2
            id="final-cta-heading"
            className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl"
          >
            The Infrastructure for the Next Economy.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-red-50 sm:text-base">
            Apply once for training, funding, apprenticeship, certification, and employment — all in
            one system.
          </p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row lg:justify-start">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-brand-red-700 transition-colors hover:bg-red-50"
            >
              Apply Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/check-eligibility"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Check Eligibility
            </Link>
          </div>

          <div className="mt-5 flex flex-col items-center gap-2 text-[11px] text-white sm:flex-row sm:flex-wrap lg:justify-start">
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1.5 font-bold text-white transition-colors hover:text-red-50"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {PLATFORM_DEFAULTS.supportPhone}
            </a>
            <span className="hidden text-red-100 sm:block" aria-hidden="true">·</span>
            <span>Call or text — Mon–Fri, 9am–5pm ET</span>
            <span className="hidden text-red-100 sm:block" aria-hidden="true">·</span>
            <Link
              href="/contact"
              className="font-semibold text-white underline underline-offset-2 transition-colors hover:text-red-50"
            >
              Send a message
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
