'use client';

import { useSearchParams } from 'next/navigation';
import { Info } from 'lucide-react';
import { Suspense } from 'react';

const notices: Record<string, string> = {
  'invalid-product': 'That product was not found. Please choose a license below.',
  'expired': 'Your license has expired. Renew or choose a new license below.',
  'redirect': 'You were redirected here. Choose a license to get started.',
};

function NoticeContent() {
  const params = useSearchParams();
  const reason = params.get('reason');

  if (!reason || !notices[reason]) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 mt-4">
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>{notices[reason]}</span>
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
