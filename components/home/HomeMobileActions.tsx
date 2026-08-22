'use client';

import Link from 'next/link';
import { Phone, SearchCheck } from 'lucide-react';

export function HomeMobileActions() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] backdrop-blur md:hidden" aria-label="Quick actions">
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
        <Link href="/check-eligibility" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-3 text-sm font-black text-white">
          <SearchCheck className="h-4 w-4" /> Check Eligibility
        </Link>
        <a href="tel:+13173143757" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-3 text-sm font-black text-slate-900">
          <Phone className="h-4 w-4" /> Call (317) 314-3757
        </a>
      </div>
    </div>
  );
}

export default HomeMobileActions;
