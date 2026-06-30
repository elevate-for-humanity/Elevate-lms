'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Shield, CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { TUITION_DOLLARS, TUITION_CENTS, MIN_SETUP_FEE_CENTS, PAYMENT_TERM_WEEKS, weeklyPaymentCents, clampSetupFeeCents } from '@/lib/barber/pricing';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Inner form ────────────────────────────────────────────────────────────────

function PaymentSetupForm({ weeklyAmount, deposit }: { weeklyAmount: number; deposit: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/programs/barber-apprenticeship/payment-setup/confirm`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Card setup failed. Please try again.');
      setSubmitting(false);
      return;
    }

    // Setup succeeded — activate subscription then go to complete
    try {
      const res = await fetch('/api/barber/activate-subscription', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to activate subscription. Contact support.');
        setSubmitting(false);
        return;
      }
    } catch {
      // Non-fatal — subscription activation will be retried by cron
    }

    router.push('/programs/barber-apprenticeship/orientation');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'auto', email: 'auto' } },
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold py-4 rounded-xl transition-colors text-base"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Setting up payments…
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" /> Save Card &amp; Activate Program
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        Down payment of <strong className="text-slate-300">${deposit.toLocaleString()}</strong> charged today.
        Then <strong className="text-slate-300">${(weeklyAmount / 100).toFixed(2)}/week</strong> for {PAYMENT_TERM_WEEKS} weeks.
      </p>
    </form>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const MIN_DEPOSIT = MIN_SETUP_FEE_CENTS / 100; // $600
const MAX_DEPOSIT = TUITION_DOLLARS;            // $4,980

function clampDeposit(v: number) {
  return Math.min(MAX_DEPOSIT, Math.max(MIN_DEPOSIT, Math.round(v)));
}

export default function PaymentSetupPage() {
  const [deposit, setDeposit] = useState(MIN_DEPOSIT);
  const [depositInput, setDepositInput] = useState(String(MIN_DEPOSIT));
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [weeklyAmount, setWeeklyAmount] = useState(() => weeklyPaymentCents(MIN_DEPOSIT));
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);

  // Live display value — previews while typing before blur clamps
  const displayDeposit = (() => {
    const parsed = parseFloat(depositInput);
    if (isNaN(parsed) || depositInput.trim() === '') return deposit;
    return Math.min(MAX_DEPOSIT, Math.max(0, parsed));
  })();

  // Recalculate weekly live as deposit changes
  useEffect(() => {
    setWeeklyAmount(weeklyPaymentCents(deposit));
  }, [deposit]);

  useEffect(() => {
    fetch('/api/barber/setup-intent', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setFatalError(data.error);
          return;
        }
        setClientSecret(data.clientSecret);
        if (data.weeklyPaymentCents) setWeeklyAmount(data.weeklyPaymentCents);
      })
      .catch(() => setFatalError('Could not connect to payment system. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs uppercase tracking-widest mb-0.5">
              Barber Apprenticeship
            </p>
            <h1 className="text-white font-bold text-lg">Payment Setup</h1>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Lock className="w-3.5 h-3.5" />
            Secured by Stripe
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-10 space-y-8">
        {/* Deposit Calculator */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Choose Your Down Payment</p>
              <p className="text-slate-400 text-sm">Slide to adjust — weekly payment updates live</p>
            </div>
          </div>

          {/* Deposit input + slider */}
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-xl shrink-0">$</span>
            <input
              type="number"
              min={MIN_DEPOSIT}
              max={MAX_DEPOSIT}
              step={1}
              value={depositInput}
              onChange={(e) => setDepositInput(e.target.value)}
              onBlur={() => {
                const parsed = parseFloat(depositInput);
                const clamped = isNaN(parsed) || depositInput.trim() === ''
                  ? MIN_DEPOSIT
                  : clampDeposit(parsed);
                setDeposit(clamped);
                setDepositInput(String(clamped));
                setWeeklyAmount(weeklyPaymentCents(clamped));
              }}
              className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white font-bold text-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <input
            type="range"
            min={MIN_DEPOSIT}
            max={MAX_DEPOSIT}
            step={1}
            value={deposit}
            onChange={(e) => {
              const v = Number(e.target.value);
              setDeposit(v);
              setDepositInput(String(v));
              setWeeklyAmount(weeklyPaymentCents(v));
            }}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Min ${MIN_DEPOSIT.toLocaleString()}</span>
            <span>Pay in full ${MAX_DEPOSIT.toLocaleString()}</span>
          </div>

          {/* Live calculation */}
          {deposit >= MAX_DEPOSIT ? (
            <div className="bg-brand-green-900/30 border border-brand-green-700 rounded-xl p-4 text-center">
              <p className="text-brand-green-400 font-bold text-lg">Paid in Full</p>
              <p className="text-slate-400 text-xs mt-0.5">No weekly payments — one-time charge of ${MAX_DEPOSIT.toLocaleString()}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { label: 'Down Today', value: `$${displayDeposit.toLocaleString()}` },
                { label: 'Remaining', value: `$${Math.max(0, TUITION_DOLLARS - displayDeposit).toLocaleString()}` },
                { label: `Weekly ×${PAYMENT_TERM_WEEKS}`, value: `$${(weeklyPaymentCents(deposit) / 100).toFixed(2)}` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-900 rounded-xl p-3 text-center">
                  <p className="text-white font-bold text-lg">{value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guarantees */}
        <div className="space-y-2">
          {[
            'No charge today — first draft next Friday',
            'Cancel or update your card anytime',
            'Automatic reminder 3 days before each payment',
            'Failed payments get a 7-day grace period before suspension',
          ].map((text) => (
            <div key={text} className="flex items-center gap-2.5 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-brand-green-400 shrink-0" />
              {text}
            </div>
          ))}
        </div>

        {/* Stripe form */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          </div>
        )}

        {fatalError && (
          <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{fatalError}</p>
          </div>
        )}

        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#f59e0b',
                  colorBackground: '#1e293b',
                  colorText: '#f1f5f9',
                  colorDanger: '#f87171',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <PaymentSetupForm weeklyAmount={weeklyAmount} deposit={deposit} />
          </Elements>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs pt-2">
          <Shield className="w-3.5 h-3.5" />
          256-bit SSL encryption · PCI DSS compliant · Powered by Stripe
        </div>
      </div>
    </div>
  );
}
