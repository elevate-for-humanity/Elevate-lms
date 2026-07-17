export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BnplPageClient } from './BnplPageClient';
import { Loader2 } from 'lucide-react';
import { BNPL_DESCRIPTION } from '@/lib/bnpl-config';

export const metadata: Metadata = {
  title: 'Pay with BNPL — Barber Apprenticeship',
  description:
    `Barber apprenticeship tuition payment options. ${BNPL_DESCRIPTION}`,
  robots: { index: false, follow: false },
};

export default function BnplPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <BnplPageClient />
    </Suspense>
  );
}
