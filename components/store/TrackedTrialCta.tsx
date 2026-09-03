'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DemoTrialFunnelEvents } from '@/lib/analytics/events';

interface TrackedTrialCtaProps {
  source: string;
  className?: string;
}

export function TrackedTrialCta({ source, className }: TrackedTrialCtaProps) {
  return (
    <Link
      href="/store/trial"
      onClick={() => DemoTrialFunnelEvents.demoPrimaryCtaClicked()}
      className={
        className ||
        'inline-flex items-center justify-center gap-2 px-10 py-4 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 transition-colors text-lg'
      }
      data-source={source}
    >
      Start 14-Day Trial <ArrowRight className="w-5 h-5" />
    </Link>
  );
}
