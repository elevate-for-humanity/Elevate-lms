'use client';

import Image from 'next/image';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check, Calendar, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { TRIAL_DAYS } from '@/lib/license/types';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<{
    customerEmail: string;
    planName: string;
    trialEnd: Date;
  } | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/store/checkout/verify?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          // Fallback if session can't be verified
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
          setSessionData({ customerEmail: '', planName: 'Platform License', trialEnd });
        } else {
          setSessionData({
            customerEmail: data.customerEmail || '',
            planName: data.planName || 'Platform License',
            trialEnd: data.trialEnd ? new Date(data.trialEnd * 1000) : (() => {
              const d = new Date();
              d.setDate(d.getDate() + TRIAL_DAYS);
              return d;
            })(),
          });
        }
      })
      .catch(() => {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
        setSessionData({ customerEmail: '', planName: 'Platform License', trialEnd });
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Elevate store" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Confirming your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-brand-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            Trial Started Successfully
          </h1>
          <p className="text-lg text-gray-600">
            Your {TRIAL_DAYS}-day free trial is now active.
          </p>
        </div>

        {/* Trial Info Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-8">
          <div className="flex items-center gap-4 p-4 bg-brand-blue-50 rounded-xl mb-6">
            <Calendar className="w-6 h-6 text-brand-blue-600" />
            <div>
              <p className="font-bold text-brand-blue-900">
                Trial ends {sessionData?.trialEnd.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <p className="text-sm text-brand-blue-700">
                Your card will be charged automatically when the trial ends.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">What's next?</h2>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Your dashboard is ready</h3>
                <p className="text-sm text-gray-600">
                  Start exploring the platform immediately.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Set up your programs</h3>
                <p className="text-sm text-gray-600">
                  Configure eligibility pathways and program settings.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Invite your team</h3>
                <p className="text-sm text-gray-600">
                  Add admin users to help manage the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <Link
              href="/admin"
              className="block w-full text-center bg-white text-slate-900 py-4 rounded-lg font-bold text-lg hover:bg-white transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </Link>
          </div>
        </div>

        {/* Billing Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Billing</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            You can manage your subscription, update payment methods, or cancel anytime from your account settings.
          </p>
          <Link
            href="/account/billing"
            className="text-sm text-brand-blue-600 font-medium hover:underline"
          >
            Manage Billing →
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Questions? <Link href="/contact" className="text-brand-blue-600 hover:underline">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-brand-green-500 animate-spin" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
