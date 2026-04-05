"use client";

import React from 'react';

import { useEffect, useState } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export default function FacebookPixel() {
  const [mounted, setMounted] = useState(false);
  const [pathname, setPathname] = useState<string>('');

  // Mount on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get pathname safely after mount
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        setPathname(window.location.pathname);
      } catch (error) { /* Error handled silently */ 
      }
    }
  }, [mounted]);

  // Track page views on route change (only after mounted)
  useEffect(() => {
    if (!mounted || !FB_PIXEL_ID || typeof window === 'undefined') return;

    try {
      // Track page view
      if (window.fbq) {
        window.fbq('track', 'PageView');
      }
    } catch (error) { /* Error handled silently */ 
      // Silently fail - don't break the app
    }
  }, [mounted, pathname]);

  // Critical: server render and first client render both return null
  if (!mounted || !FB_PIXEL_ID || typeof window === 'undefined') return null;

  try {
    return (
      <>
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            try {
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FB_PIXEL_ID}');
              fbq('track', 'PageView');
            } catch (error) { /* Error handled silently */ }
          `}
        </Script>

        <noscript>
          {/* Tracking pixel - empty alt is intentional for decorative/tracking images */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt="Tracking pixel"
            aria-hidden="true"
            role="presentation"
          />
        </noscript>
      </>
    );
  } catch (error) { /* Error handled silently */ 
    return null;
  }
}

// Helper functions for tracking events
export const trackFacebookEvent = (
  eventName: string,
  data?: Record<string, any>
) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data);
  }
};

// Predefined events
export const trackCourseView = (courseId: string, courseName: string) => {
  trackFacebookEvent('ViewContent', {
    content_name: courseName,
    content_category: 'Course',
    content_ids: [courseId],
    content_type: 'product',
  });
};

export const trackEnrollment = (
  courseId: string,
  courseName: string,
  value?: number
) => {
  trackFacebookEvent('InitiateCheckout', {
    content_name: courseName,
    content_category: 'Course',
    content_ids: [courseId],
    value: value || 0,
    currency: 'USD',
  });
};

export const trackCourseCompletion = (courseId: string, courseName: string) => {
  trackFacebookEvent('Purchase', {
    content_name: courseName,
    content_category: 'Course',
    content_ids: [courseId],
    value: 0,
    currency: 'USD',
  });
};

export const trackSignup = (method: string = 'email') => {
  trackFacebookEvent('CompleteRegistration', {
    content_name: 'User Signup',
    status: 'completed',
    method,
  });
};

export const trackSearch = (searchQuery: string) => {
  trackFacebookEvent('Search', {
    search_string: searchQuery,
  });
};
