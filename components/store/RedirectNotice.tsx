'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Info, ArrowRight } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { DemoTrialFunnelEvents } from '@/lib/analytics/events';

const notices: Record<string, { message: string; cta?: string; href?: string }> = {
  'invalid-product': {
    message: 'That product was not found.',
    cta: 'View available licenses',
    href: '#licenses',
  },
  'expired': {
    message: 'Your license has expired.',
    cta: 'Renew license to restore access',
    href: '/store/licenses/managed-platform',
  },
  'redirect': {
    message: 'You were redirected here.',
    cta: 'Choose a license to get started',
    href: '#licenses',
  },
};

function NoticeContent() {
  const params = useSearchParams();
  const reason = params.get('reason');
  const from = params.get('from');

  useEffect(() => {
    if (reason && notices[reason]) {
      DemoTrialFunnelEvents.redirectNoticeShown(reason);
    }
  }, [reason]);

  if (!reason || !notices[reason]) return null;

  const { message, cta, href } = notices[reason];
  const displayMessage = from
    ? `${message} (from ${from})`
    : message;

  return (
    <div className="max-w-3xl mx-auto px-4 mt-4">
      <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{displayMessage}</span>
        </div>
        {cta && href && (
          <Link
            href={href}
            onClick={() => DemoTrialFunnelEvents.redirectNoticeCtaClicked(reason)}
            className="flex items-center gap-1 font-semibold whitespace-nowrap hover:underline"
          >
            {cta} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function RedirectNotice() {
  return (
    <Suspense fallback={null}>
      <NoticeContent />
    </Suspense>
  );
}
