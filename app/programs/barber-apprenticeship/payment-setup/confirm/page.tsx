'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { Loader2, XCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Stripe redirects here after 3DS authentication with ?setup_intent=... and ?redirect_status=...
function ConfirmInner() {
  const params = useSafeSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const redirectStatus = params.get('redirect_status');

    if (redirectStatus !== 'succeeded') {
      setStatus('error');
      setErrorMsg('Card authentication did not complete. Please try again.');
      return;
    }

    // Activate the subscription now that the SetupIntent succeeded
    fetch('/api/barber/activate-subscription', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStatus('error');
          setErrorMsg(data.error);
        } else {
          setStatus('success');
          // Give the user a moment to see the success state, then go to orientation
          setTimeout(() => router.push('/programs/barber-apprenticeship/orientation'), 2000);
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Could not activate subscription. Please contact support.');
      });
  }, [params, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Activating your program…</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <span className="w-12 h-12 rounded-full bg-emerald-400 inline-block flex-shrink-0 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-white font-bold text-xl mb-2">Payment Set Up</h1>
          <p className="text-slate-400 text-sm">Taking you to orientation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-white font-bold text-xl mb-2">Setup Incomplete</h1>
        <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
        <button
          onClick={() => router.push('/programs/barber-apprenticeship/payment-setup')}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Try Again
        </button>
        <p className="mt-4 text-xs text-slate-500">
          Need help? Call {PLATFORM_DEFAULTS.supportPhone}
        </p>
      </div>
    </div>
  );
}

export default function PaymentSetupConfirmPage() {
  return (
          <ConfirmInner />
  );
}
