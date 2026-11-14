'use client';

import { useEffect } from 'react';
import { trackAdsConversion, CONVERSION_ACTIONS } from './google-ads';

type ConversionType = keyof typeof CONVERSION_ACTIONS;

interface ConversionPixelProps {
  type: ConversionType;
  value?: number;
}

/**
 * Drop this into any server-rendered success/thank-you page.
 * Fires the Google Ads conversion event once on mount.
 */
export function ConversionPixel({ type, value }: ConversionPixelProps) {
  useEffect(() => {
    trackAdsConversion(CONVERSION_ACTIONS[type], value);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
