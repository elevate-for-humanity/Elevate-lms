'use client';

import { ACTIVE_BNPL_PROVIDERS } from '@/lib/bnpl-config';

interface Props {
  fullPrice: number;
  /** Currently selected payment option id */
  selected: string;
  onSelect: (id: string) => void;
  /** Amount the user has typed/slid */
  amountStr: string;
  onAmountChange: (val: string) => void;
}

/**
 * Universal BNPL option list.
 *
 * Driven entirely by ACTIVE_BNPL_PROVIDERS in lib/bnpl-config.ts.
 * Users can enter any amount — only the provider's own min/max is enforced.
 * To add or remove a provider, update lib/bnpl-config.ts only.
 */
export default function BnplOptions({
  fullPrice,
  selected,
  onSelect,
  amountStr,
  onAmountChange,
}: Props) {
  const amount = parseInt(amountStr) || fullPrice;

  return (
    <>
      {ACTIVE_BNPL_PROVIDERS.map((provider) => {
        const optionId =
          provider.id === 'affirm' ? 'affirm'
          : provider.id === 'sezzle' ? 'sezzle'
          : 'stripe_bnpl';

        const maxAmt = provider.maxAmount > 0 ? provider.maxAmount : fullPrice;
        const minAmt = provider.minAmount;
        const isSelected = selected === optionId;
        const isStripNative = !['affirm', 'sezzle'].includes(provider.id);

        // Group all Stripe-native providers under one button (Klarna represents the group)
        if (isStripNative && provider.id !== 'klarna') return null;

        const label = isStripNative
          ? ACTIVE_BNPL_PROVIDERS.filter((p) => !['affirm', 'sezzle'].includes(p.id))
              .map((p) => p.name)
              .join(' / ')
          : provider.name;

        return (
          <div key={provider.id}>
            <button
              type="button"
              onClick={() => onSelect(optionId)}
              className={`w-full p-4 rounded-xl border-2 mb-2 text-left transition ${
                isSelected
                  ? 'border-brand-blue-600 bg-brand-blue-50'
                  : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-black text-lg">{label}</p>
                  <p className="text-black text-sm">{provider.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-blue-600 text-lg">You Choose</p>
                  <p className="text-xs text-black">
                    ${minAmt.toLocaleString()}
                    {provider.maxAmount > 0 ? ` – $${maxAmt.toLocaleString()}` : '+'}
                  </p>
                </div>
              </div>
            </button>

            {/* Amount input for SDK-based providers (Affirm, Sezzle) */}
            {isSelected && !isStripNative && (
              <div className="bg-brand-blue-50 rounded-xl p-4 mb-3 border-2 border-brand-blue-200">
                <label className="block text-sm font-medium text-black mb-2">
                  How much do you want to finance with {provider.name}?
                </label>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl font-bold text-black">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={amountStr}
                    onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => {
                      const num = parseInt(amountStr) || fullPrice;
                      onAmountChange(String(Math.max(minAmt, Math.min(num, maxAmt))));
                    }}
                    className="w-full px-4 py-3 text-2xl font-bold border-2 border-brand-blue-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
                <input
                  type="range"
                  min={minAmt}
                  max={maxAmt}
                  step={50}
                  value={Math.min(Math.max(amount, minAmt), maxAmt)}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="w-full accent-brand-blue-600 mb-1"
                />
                <div className="flex justify-between text-xs text-slate-500 mb-3">
                  <span>${minAmt.toLocaleString()} min</span>
                  <span>${maxAmt.toLocaleString()} max</span>
                </div>
                <p className="text-sm text-slate-600">
                  {provider.id === 'sezzle' && amount > 0
                    ? `4 payments of $${Math.round(amount / 4).toLocaleString()} every 2 weeks`
                    : `${provider.name} will show your payment options at checkout.`}
                </p>
              </div>
            )}

            {/* Stripe-native — no amount input, provider chosen at Stripe checkout */}
            {isSelected && isStripNative && (
              <div className="bg-brand-blue-50 rounded-xl p-4 mb-3 border-2 border-brand-blue-200">
                <p className="text-sm text-black">
                  Choose your preferred provider on the next screen. All options split your payment
                  into installments. Subject to provider approval.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
