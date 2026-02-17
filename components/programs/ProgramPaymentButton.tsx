'use client';

import { useState } from 'react';
import { CreditCard, Calendar, Award } from 'lucide-react';

interface ProgramPaymentButtonProps {
  programSlug: string;
  programName: string;
  price: number;
  etplProgramId?: string;
  partnerUrl?: string;
}

export function ProgramPaymentButton({
  programSlug,
  programName,
  price,
  etplProgramId,
  partnerUrl
}: ProgramPaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = (paymentType: 'full' | 'plan' | 'funding') => {
    if (paymentType === 'funding') {
      // Go directly to funding application
      window.location.href = `/apply?program=${programSlug}`;
      return;
    }

    // For paid programs, go directly to partner page or checkout
    if (partnerUrl) {
      window.location.href = partnerUrl;
    } else {
      // Go to payment page
      window.location.href = `/pay?program=${programSlug}&type=${paymentType}&amount=${price}`;
    }
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-6 sticky top-4">
      <div className="mb-6">
        <div className="text-sm text-black mb-1">Program Cost</div>
        <div className="text-4xl font-bold text-black">
          ${price.toLocaleString()}
        </div>
        {etplProgramId && (
          <div className="text-sm text-brand-green-600 mt-2">
            • ETPL Approved - Funding Available
          </div>
        )}
      </div>

      <div className="space-y-3">
        {/* Free with Funding */}
        {etplProgramId && (
          <button
            onClick={() => handlePayment('funding')}
            disabled={loading}
            className="w-full py-4 bg-brand-green-600 text-white font-bold rounded-lg hover:bg-brand-green-700 transition flex items-center justify-center gap-2"
          >
            <Award className="w-5 h-5" />
            Apply for 100% Free Training
          </button>
        )}

        {/* Pay in Full */}
        <button
          onClick={() => handlePayment('full')}
          disabled={loading}
          className="w-full py-4 bg-brand-orange-500 text-white font-bold rounded-lg hover:bg-brand-orange-600 transition flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          Pay ${price.toLocaleString()} Now
        </button>

        {/* Payment Plan */}
        {price >= 500 && (
          <button
            onClick={() => handlePayment('plan')}
            disabled={loading}
            className="w-full py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            4 Payments of ${Math.ceil(price / 4).toLocaleString()}
          </button>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <div className="text-sm text-black space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-brand-green-600">•</span>
            <span>Secure payment via Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-green-600">•</span>
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-brand-green-600">•</span>
            <span>Instant access after payment</span>
          </div>
          {partnerUrl && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
              <span className="text-brand-blue-600">→</span>
              <span className="font-medium">Redirects to partner platform to start program</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-center">
        <a
          href="/contact"
          className="text-sm text-brand-blue-600 hover:underline"
        >
          Questions? Contact us
        </a>
      </div>
    </div>
  );
}
