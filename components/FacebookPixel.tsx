'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
const CONSENT_KEY = 'cookie-consent';
const CONSENT_EVENT = 'efh:cookie-consent';
const SCRIPT_ID = 'meta-pixel-script';

function hasMarketingConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

function initializePixel(): void {
  if (!META_PIXEL_ID || typeof window === 'undefined' || window.fbq) return;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  } as MetaPixelFunction;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  fbq('init', META_PIXEL_ID);

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }
}

/** Loads Meta Pixel only after affirmative optional-cookie consent. */
export default function FacebookPixel() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const syncConsent = () => setEnabled(hasMarketingConsent());
    syncConsent();
    window.addEventListener(CONSENT_EVENT, syncConsent);
    return () => window.removeEventListener(CONSENT_EVENT, syncConsent);
  }, []);

  useEffect(() => {
    if (!enabled || !META_PIXEL_ID) return;
    initializePixel();
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    window.fbq?.('track', 'PageView');
  }, [enabled, pathname]);

  return null;
}

export function trackFacebookEvent(eventName: string, data?: Record<string, unknown>) {
  if (!META_PIXEL_ID || !hasMarketingConsent() || typeof window === 'undefined') return;
  initializePixel();
  window.fbq?.('track', eventName, data ?? {});
}

export function trackFacebookCustomEvent(eventName: string, data?: Record<string, unknown>) {
  if (!META_PIXEL_ID || !hasMarketingConsent() || typeof window === 'undefined') return;
  initializePixel();
  window.fbq?.('trackCustom', eventName, data ?? {});
}

export const trackCourseView = (courseId: string, courseName: string, value = 0) =>
  trackFacebookEvent('ViewContent', {
    content_name: courseName,
    content_category: 'Course',
    content_ids: [courseId],
    content_type: 'product',
    value,
    currency: 'USD',
  });

export const trackEnrollmentStart = (courseId: string, courseName: string, value = 0) =>
  trackFacebookEvent('InitiateCheckout', {
    content_name: courseName,
    content_category: 'Course',
    content_ids: [courseId],
    content_type: 'product',
    value,
    currency: 'USD',
  });

export const trackApplicationLead = (programId: string, programName: string) =>
  trackFacebookEvent('Lead', {
    content_name: programName,
    content_category: 'Program Application',
    content_ids: [programId],
  });

export const trackSignup = (method = 'email') =>
  trackFacebookEvent('CompleteRegistration', {
    content_name: 'User Signup',
    status: 'completed',
    method,
  });

export const trackSearch = (searchQuery: string) =>
  trackFacebookEvent('Search', { search_string: searchQuery });
