'use client';

import React from 'react';

import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile Widget
 *
 * Free, privacy-friendly CAPTCHA alternative
 *
 * Setup:
 * 1. Get site key from Cloudflare dashboard
 * 2. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY to .env
 * 3. Add TURNSTILE_SECRET_KEY to .env (server-side)
 * 4. Add script to app/layout.tsx:
 *    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
 */
export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      return;
    }

    if (!containerRef.current) return;

    // Wait for Turnstile script to load
    const checkTurnstile = setInterval(() => {
      if (window.turnstile && containerRef.current) {
        clearInterval(checkTurnstile);

        // Render widget
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          'error-callback': onError,
          'expired-callback': onExpire,
          theme,
          size,
        });
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(checkTurnstile);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [onVerify, onError, onExpire, theme, size]);

  return <div ref={containerRef} />;
}
