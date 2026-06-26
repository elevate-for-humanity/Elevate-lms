/**
 * HomeFinalCTA
 *
 * Strong workforce transformation close.
 * Primary: Apply. Secondary: Check Eligibility.
 * Phone number for direct contact.
 */

import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export function HomeFinalCTA() {
  return (
    <section
      className="relative bg-brand-red-700 py-6 sm:py-8 px-4"
      aria-labelledby="final-cta-heading"
    >
      <div className="relative max-w-2xl mx-auto text-center">
        <p className="text-white/90 text-[10px] font-bold uppercase tracking-widest mb-2">
          Ready to start?
        </p>
        <h2
          id="final-cta-heading"
          className="text-lg sm:text-xl font-extrabold text-white mb-2 leading-snug"
        >
          The Infrastructure for the Next Economy.
        </h2>
        <p className="text-red-50 text-xs sm:text-sm leading-relaxed mb-4 max-w-lg mx-auto">
          Apply once for training, funding, apprenticeship, certification, and employment — all in
          one system.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-1.5 bg-white text-brand-red-700 font-bold px-5 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm"
          >
            Apply Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/check-eligibility"
            className="inline-flex items-center justify-center gap-1.5 border border-white/70 text-white font-semibold px-5 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
          >
            Check Eligibility
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-white text-[11px]">
          <a
            href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
            className="inline-flex items-center gap-1.5 text-white font-bold hover:text-red-50 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" aria-hidden="true" />
            {PLATFORM_DEFAULTS.supportPhone}
          </a>
          <span className="hidden sm:block text-red-100" aria-hidden="true">·</span>
          <span>Call or text — Mon–Fri, 9am–5pm ET</span>
          <span className="hidden sm:block text-red-100" aria-hidden="true">·</span>
          <Link href="/contact" className="text-white font-semibold underline underline-offset-2 hover:text-red-50 transition-colors">
            Send a message
          </Link>
        </div>
      </div>
    </section>
  );
}
