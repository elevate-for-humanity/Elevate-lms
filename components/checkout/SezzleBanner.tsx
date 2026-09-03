'use client';
import { logger } from '@/lib/logger';

import { useEffect } from 'react';
import Script from 'next/script';

interface SezzleBannerProps {
  merchantUUID?: string;
  theme?: 'indigo' | 'black';
  renderToContainer?: string;
}

declare global {
  interface Window {
    SezzleBanner: new (config: {
      merchantUUID: string;
      theme: string;
      renderToContainer: string;
    }) => {
      init: () => void;
    };
  }
}

/**
 * Sezzle Banner Component
 *
 * Displays a promotional banner showing "Pay in 4 interest-free payments"
 * Add to homepage or header to increase conversions.
 *
 * Usage:
 * <SezzleBanner />
 * <SezzleBanner theme="black" />
 */
export default function SezzleBanner({
  merchantUUID,
  theme = 'indigo',
  renderToContainer = '#sezzle-banner-render-reference',
}: SezzleBannerProps) {
  const merchantId = merchantUUID || process.env.NEXT_PUBLIC_SEZZLE_MERCHANT_ID;

  useEffect(() => {
    if (typeof window !== 'undefined' && window.SezzleBanner && merchantId) {
      try {
        new window.SezzleBanner({
          merchantUUID: merchantId,
          theme: theme,
          renderToContainer: renderToContainer,
        }).init();
      } catch (e) {
        logger.warn('Sezzle banner initialization error:', e);
      }
    }
  }, [merchantId, theme, renderToContainer]);

  if (!merchantId) {
    return null;
  }

  return (
    <>
      <Script
        src="https://checkout-sdk.sezzle.com/sezzle-home-banner.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.SezzleBanner && merchantId) {
            new window.SezzleBanner({
              merchantUUID: merchantId,
              theme: theme,
              renderToContainer: renderToContainer,
            }).init();
          }
        }}
      />
      <div id="sezzle-banner-render-reference" />
    </>
  );
}
