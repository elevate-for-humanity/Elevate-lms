'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, CreditCard, Eye, EyeOff, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface VirtualCardData {
  firstName: string;
  lastName: string;
  pan: string; // Card number
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  token?: string;
}

interface SezzleVirtualCardProps {
  cardData: VirtualCardData;
  amount: number;
  onUseCard?: () => void;
  orderId?: string;
}

/**
 * Sezzle Virtual Card Display
 * 
 * Shows the virtual card details after Sezzle checkout approval.
 * Customer can copy card details to use at checkout.
 * 
 * Usage:
 * <SezzleVirtualCard 
 *   cardData={{ pan: '4111...', cvv: '123', ... }} 
 *   amount={199.99} 
 * />
 */
export default function SezzleVirtualCard({
  cardData,
  amount,
  onUseCard,
  orderId,
}: SezzleVirtualCardProps) {
  const [showCvv, setShowCvv] = useState(false);
  const supabase = createClient();

  // Log virtual card display for audit
  useEffect(() => {
    async function logCardDisplay() {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('sezzle_card_events')
        .insert({
          user_id: user?.id,
          order_id: orderId,
          event_type: 'card_displayed',
          amount,
          card_last_four: cardData.pan.slice(-4),
          timestamp: new Date().toISOString()
        });
    }
    logCardDisplay();
  }, [orderId, amount, cardData.pan, supabase]);

  // Log card copy events
  const logCopyEvent = async (field: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('sezzle_card_events')
      .insert({
        user_id: user?.id,
        order_id: orderId,
        event_type: `copied_${field}`,
        timestamp: new Date().toISOString()
      });
  };
  const [showPan, setShowPan] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCardNumber = (pan: string) => {
    if (showPan) {
      return pan.replace(/(.{4})/g, '$1 ').trim();
    }
    // Show last 4 digits only
    return `•••• •••• •••• ${pan.slice(-4)}`;
  };

  const formatExpiry = () => {
    return `${cardData.expiryMonth.padStart(2, '0')}/${cardData.expiryYear.slice(-2)}`;
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Success Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-brand-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your Virtual Card is Ready!</h2>
        <p className="text-gray-600 mt-2">
          Use this card to complete your ${amount.toFixed(2)} purchase
        </p>
      </div>

      {/* Virtual Card */}
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl mb-6">
        {/* Card chip and logo */}
        <div className="flex justify-between items-start mb-8">
          <div className="w-12 h-9 bg-yellow-400/80 rounded-md" />
          <div className="text-right">
            <span className="text-lg font-bold">Sezzle</span>
            <p className="text-xs text-purple-200">Virtual Card</p>
          </div>
        </div>

        {/* Card Number */}
        <div className="mb-6">
          <p className="text-xs text-purple-200 mb-1">Card Number</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono tracking-wider">
              {formatCardNumber(cardData.pan)}
            </span>
            <button
              onClick={() => setShowPan(!showPan)}
              className="p-1 hover:bg-white/10 rounded"
            >
              {showPan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(cardData.pan, 'pan')}
              className="p-1 hover:bg-white/10 rounded"
            >
              {copiedField === 'pan' ? (
                <Check className="w-4 h-4 text-brand-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Card Details Row */}
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-purple-200 mb-1">Card Holder</p>
            <p className="font-medium">
              {cardData.firstName} {cardData.lastName}
            </p>
          </div>
          <div>
            <p className="text-xs text-purple-200 mb-1">Expires</p>
            <div className="flex items-center gap-2">
              <span className="font-mono">{formatExpiry()}</span>
              <button
                onClick={() => copyToClipboard(formatExpiry(), 'expiry')}
                className="p-1 hover:bg-white/10 rounded"
              >
                {copiedField === 'expiry' ? (
                  <Check className="w-4 h-4 text-brand-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-purple-200 mb-1">CVV</p>
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {showCvv ? cardData.cvv : '•••'}
              </span>
              <button
                onClick={() => setShowCvv(!showCvv)}
                className="p-1 hover:bg-white/10 rounded"
              >
                {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(cardData.cvv, 'cvv')}
                className="p-1 hover:bg-white/10 rounded"
              >
                {copiedField === 'cvv' ? (
                  <Check className="w-4 h-4 text-brand-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Visa logo placeholder */}
        <div className="absolute bottom-6 right-6">
          <CreditCard className="w-10 h-10 text-slate-400" />
        </div>
      </div>

      {/* Copy All Button */}
      <button
        onClick={() => {
          const cardDetails = `Card: ${cardData.pan}\nExpiry: ${formatExpiry()}\nCVV: ${cardData.cvv}\nName: ${cardData.firstName} ${cardData.lastName}`;
          copyToClipboard(cardDetails, 'all');
        }}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 mb-4"
      >
        {copiedField === 'all' ? (
          <>
            <Check className="w-5 h-5" />
            Copied All Details!
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            Copy All Card Details
          </>
        )}
      </button>

      {/* Use Card Button */}
      {onUseCard && (
        <button
          onClick={onUseCard}
          className="w-full py-3 bg-brand-green-600 hover:bg-brand-green-700 text-white rounded-lg font-medium"
        >
          Continue to Payment
        </button>
      )}

      {/* Security Notice */}
      <div className="flex items-start gap-3 mt-6 p-4 bg-gray-50 rounded-lg">
        <Shield className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">Secure Virtual Card</p>
          <p>This card is valid for one-time use only. It will expire after your purchase or within 24 hours.</p>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Your Payment Schedule</h3>
        <div className="grid grid-cols-4 gap-2 text-center text-sm">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-2 bg-gray-50 rounded">
              <p className="text-gray-500 text-xs">
                {i === 0 ? 'Today' : `+${i * 2} weeks`}
              </p>
              <p className="font-semibold text-gray-900">
                ${(amount / 4).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          0% interest • No hidden fees
        </p>
      </div>
    </div>
  );
}
