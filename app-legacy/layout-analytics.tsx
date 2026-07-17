'use client';

import React from 'react';

export function Analytics() {
  return null;
}

export function trackEvent(eventName: string, eventParams?: Record<string, any>) {
  // Analytics disabled for performance
}

export function trackConversion(
  conversionType: 'application' | 'enrollment' | 'contact' | 'download',
) {
  // Analytics disabled for performance
}
