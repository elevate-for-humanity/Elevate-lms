'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSafeSearchParams } from '@/hooks/useSafeSearchParams';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { XCircle, Loader2, Phone, Mail } from 'lucide-react';
import { getBeautyProgram, colorClasses } from '@/lib/programs/beauty-programs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

function ConfirmContent() {
  const params = useParams<{ program: string }>();
  const router = useRouter();
  const searchParams = useSafeSearchParams();
  const cfg = getBeautyProgram(params.program);
  const c = colorClasses(cfg?.color ?? 'blue');

  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      .then(r => r.json())
      .then(d => setStatus(d.paid ? 'success' : 'error'))
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (!cfg) {
    router.replace(`/programs/${params.program}`);
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className={`w-8 h-8 animate-spin ${c.spinner}`} />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Not Confirmed</h1>
          <p className="text-slate-600 mb-6">
            We couldn&apos;t verify your payment. Please contact us or try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/programs/${cfg.slug}/apply`}
              className={`px-6 py-3 ${c.bg} text-white font-bold rounded-lg ${c.hover} transition`}
            >
              Try Again
            </Link>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone}`}
              className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition flex items-center gap-2 justify-center"
            >
              <Phone className="w-4 h-4" /> Call Us
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 ${c.bg} rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg`}>
            <span className="w-10 h-10 rounded-full bg-white inline-block flex-shrink-0" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Confirmed</h1>
          <p className="text-slate-600">
            Your deposit for the {cfg.title} has been received.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
          <h2 className="font-bold text-slate-900 mb-4">Next Steps</h2>
          <div className="space-y-3">
            {[
              'Check your email for a payment receipt from Stripe.',
              'Create your account or sign in to access orientation.',
              `Complete orientation — takes about ${cfg.orientationTime}.`,
              'Upload your government-issued ID.',
              'Our team will confirm your host location placement within 1–2 business days.',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 ${c.bgLight} ${c.textLight} rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5`}>
                  {i + 1}
                </div>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/signup?role=apprentice&redirect=/programs/${cfg.slug}/orientation`}
            className={`flex-1 text-center py-3 ${c.bg} text-white font-bold rounded-lg ${c.hover} transition`}
          >
            Create Account &amp; Continue
          </Link>
          <a
            href="mailto:info@elevateforhumanity.org"
            className="flex-1 text-center py-3 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition flex items-center gap-2 justify-center"
          >
            <Mail className="w-4 h-4" /> Email Us
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BeautyConfirmPage() {
  return (
          <ConfirmContent />
  );
}
