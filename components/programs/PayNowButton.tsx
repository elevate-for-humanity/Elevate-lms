'use client';

import { CreditCard } from 'lucide-react';

interface PayNowButtonProps {
  slug: string;
  cost: string;
  stripeCheckoutHref?: string;
  label?: string;
  className?: string;
}

/** Program CTA now enters canonical enrollment; approved self-pay enrollments receive a QuickBooks invoice. */
export function PayNowButton({ slug, cost, label, className = '' }: PayNowButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={`/programs/${encodeURIComponent(slug)}/apply`}
        className={`flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue-600 py-3.5 text-sm font-bold text-white hover:bg-brand-blue-700 ${className}`}
      >
        <CreditCard className="h-4 w-4" />
        {label ?? `Apply & Pay — ${cost}`}
      </a>
      <p className="text-center text-[10px] text-slate-500">
        Approved self-pay students receive a secure QuickBooks invoice.
      </p>
    </div>
  );
}
