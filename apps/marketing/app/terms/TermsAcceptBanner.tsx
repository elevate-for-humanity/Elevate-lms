'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export function TermsAcceptBanner() {
  const [accepted, setAccepted] = useState(false);

  if (accepted) {
    return (
      <div className="flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 rounded-lg px-4 py-3 text-sm text-brand-green-700 font-medium">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        Terms accepted — thank you.
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <p className="text-sm text-slate-600 flex-1">
        By using this platform you agree to these Terms of Use. Click below to accept.
      </p>
      <button
        onClick={() => setAccepted(true)}
        className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
      >
        I Accept
      </button>
    </div>
  );
}
