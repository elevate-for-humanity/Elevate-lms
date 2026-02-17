'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import SezzleVirtualCard from './SezzleVirtualCard';

interface SezzleCheckoutProps {
  amount: number; // in dollars
  programName: string;
  programSlug: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone?: string;
  billingAddress?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode?: string;
  };
  referenceId: string;
  onComplete: (data: SezzleCompleteData) => void;
  onCancel: () => void;
  onFailure: (error: string) => void;
  mode?: 'popup' | 'iframe' | 'redirect';
  useTokenization?: boolean;
  showVirtualCard?: boolean; // Show card details after approval
}

interface SezzleCompleteData {
  session_id: string;
  order_uuid?: string;
  card?: {
    firstName: string;
    lastName: string;
    pan: string;
    cvv: string;
    expiryMonth: string;
    expiryYear: string;
    token?: string;
  };
  holder?: {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

declare global {
  interface Window {
    Checkout: any;
  }
}

export default function SezzleCheckout({
  amount,
  programName,
  programSlug,
  customerEmail,
  customerFirstName,
  customerLastName,
  customerPhone,
  billingAddress,
  referenceId,
  onComplete,
  onCancel,
  onFailure,
  mode = 'popup',
  useTokenization = true,
  showVirtualCard = false,
}: SezzleCheckoutProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [virtualCardData, setVirtualCardData] = useState<SezzleCompleteData['card'] | null>(null);
  const checkoutRef = useRef<any>(null);

  const publicKey = process.env.NEXT_PUBLIC_SEZZLE_PUBLIC_KEY;
  const apiMode = process.env.NEXT_PUBLIC_SEZZLE_ENVIRONMENT || 'sandbox';

  useEffect(() => {
    if (!sdkLoaded || !publicKey) return;

    // Initialize Sezzle Checkout SDK
    try {
      checkoutRef.current = new window.Checkout({
        mode: mode,
        publicKey: publicKey,
        apiMode: apiMode === 'production' ? 'live' : 'sandbox',
        isVirtualCard: true,
      });

      // Initialize event handlers
      checkoutRef.current.init({
        onClick: function (event: Event) {
          event.preventDefault();
          setIsProcessing(true);

          const checkoutPayload: any = {
            amount_in_cents: Math.round(amount * 100),
            currency: 'USD',
            merchant_reference_id: referenceId,
            customer: {
              email: customerEmail,
              first_name: customerFirstName,
              last_name: customerLastName,
              phone: customerPhone || '',
              billing_address_street1: billingAddress?.street1 || '',
              billing_address_street2: billingAddress?.street2 || '',
              billing_address_city: billingAddress?.city || '',
              billing_address_state: billingAddress?.state || '',
              billing_address_postal_code: billingAddress?.postalCode || '',
              billing_address_country_code: billingAddress?.countryCode || 'US',
            },
            items: [
              {
                name: programName,
                sku: programSlug,
                quantity: 1,
                price: {
                  amount_in_cents: Math.round(amount * 100),
                  currency: 'USD',
                },
              },
            ],
          };

          // Add tokenization if enabled
          if (useTokenization) {
            checkoutPayload.card_response_format = 'token';
          }

          checkoutRef.current.startCheckout({
            checkout_payload: checkoutPayload,
          });
        },

        onComplete: async function (response: { data: SezzleCompleteData }) {
          setIsProcessing(false);
          
          // Store virtual card data if showVirtualCard is enabled
          if (showVirtualCard && response.data.card) {
            setVirtualCardData(response.data.card);
          }
          
          // Set order reference ID
          if (response.data.session_id) {
            try {
              checkoutRef.current.setOrderReferenceID({
                session_id: response.data.session_id,
                order_id: referenceId,
              });
            } catch (e) {
              console.warn('Failed to set order reference ID:', e);
            }
          }

          onComplete(response.data);
        },

        onCancel: function () {
          setIsProcessing(false);
          onCancel();
        },

        onFailure: function (error: any) {
          setIsProcessing(false);
          onFailure(error?.message || 'Sezzle checkout failed');
        },
      });

      // Render the Sezzle button
      checkoutRef.current.renderSezzleButton('sezzle-smart-button-container');
    } catch (error) {
      console.error('Failed to initialize Sezzle SDK:', error);
      onFailure('Failed to initialize Sezzle checkout');
    }
  }, [sdkLoaded, publicKey, apiMode, mode, amount, programName, programSlug, customerEmail, customerFirstName, customerLastName, customerPhone, billingAddress, referenceId, useTokenization, onComplete, onCancel, onFailure]);

  // Check Sezzle limits
  const isBelowMinimum = amount < 35;
  const isAboveMaximum = amount > 2500;
  const isValidAmount = !isBelowMinimum && !isAboveMaximum;

  if (!publicKey) {
    return (
      <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700 text-sm">
        Sezzle is not configured. Please contact support.
      </div>
    );
  }

  if (!isValidAmount) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
        {isBelowMinimum 
          ? `Sezzle requires a minimum purchase of $35. Your total is $${amount.toFixed(2)}.`
          : `Sezzle has a maximum limit of $2,500. Your total is $${amount.toFixed(2)}.`
        }
      </div>
    );
  }

  const paymentPerInstallment = (amount / 4).toFixed(2);

  // Show virtual card if checkout completed and showVirtualCard is enabled
  if (virtualCardData && showVirtualCard) {
    return (
      <SezzleVirtualCard
        cardData={virtualCardData}
        amount={amount}
        onUseCard={() => {
          // Call onComplete to proceed with payment
          onComplete({
            session_id: '',
            card: virtualCardData,
          });
        }}
      />
    );
  }

  return (
    <div className="sezzle-checkout">
      {/* Load Sezzle SDK */}
      <Script
        src="https://checkout-sdk.sezzle.com/checkout.min.js"
        onLoad={() => setSdkLoaded(true)}
        onError={() => onFailure('Failed to load Sezzle SDK')}
      />

      {/* Payment Info */}
      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-16 h-8 bg-purple-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">Sezzle</span>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Pay in 4 interest-free payments</p>
            <p className="text-sm text-slate-600">of ${paymentPerInstallment}</p>
          </div>
        </div>
        
        {/* Payment Schedule */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="text-center p-2 bg-white rounded border">
              <div className="text-xs text-slate-500">
                {num === 1 ? 'Today' : `+${(num - 1) * 2} weeks`}
              </div>
              <div className="font-semibold text-purple-700">${paymentPerInstallment}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sezzle Button Container */}
      <div 
        id="sezzle-smart-button-container" 
        style={{ textAlign: 'center' }}
        data-template-text="Pay with %%logo%%"
        data-border-type="semi-rounded"
      />

      {/* Loading State */}
      {isProcessing && (
        <div className="mt-4 text-center text-slate-600">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2" />
          Processing with Sezzle...
        </div>
      )}

      {/* Fallback Button if SDK doesn't load */}
      {!sdkLoaded && (
        <div className="mt-4">
          <button
            disabled
            className="w-full py-3 bg-slate-200 text-slate-500 rounded-lg font-medium cursor-not-allowed"
          >
            Loading Sezzle...
          </button>
        </div>
      )}

      {/* Terms */}
      <p className="mt-3 text-xs text-slate-500 text-center">
        By clicking the Sezzle button, you agree to Sezzle's{' '}
        <a href="https://sezzle.com/terms" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="https://sezzle.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}
