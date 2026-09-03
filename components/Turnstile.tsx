'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useCallback } from 'react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  formId?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function Turnstile({ onVerify, onError, onExpire, formId }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const supabase = createClient();

  const logTurnstileEvent = async (eventType: 'verified' | 'error' | 'expired', token?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('turnstile_verifications').insert({
      user_id: user?.id,
      form_id: formId,
      event_type: eventType,
      token_prefix: token?.substring(0, 20),
      timestamp: new Date().toISOString(),
    });
  };

  const handleVerify = useCallback((token: string) => {
    void logTurnstileEvent('verified', token);
    onVerify(token);
  }, [onVerify]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleError = useCallback(() => {
    void logTurnstileEvent('error');
    onError?.();
  }, [onError]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpire = useCallback(() => {
    void logTurnstileEvent('expired');
    onExpire?.();
  }, [onExpire]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderWidget = useCallback((): void => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return;
    if (widgetIdRef.current) window.turnstile.remove(widgetIdRef.current);

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: handleVerify,
      'error-callback': handleError,
      'expired-callback': handleExpire,
      theme: 'light',
    });
  }, [handleError, handleExpire, handleVerify]);

  useEffect(() => {
    if (!SITE_KEY) {
      onVerify('turnstile-not-configured');
      return;
    }

    if (!document.getElementById('turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      script.defer = true;
      window.onTurnstileLoad = renderWidget;
      document.head.appendChild(script);
    } else if (window.turnstile) {
      renderWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
  }, [renderWidget, onVerify]);

  if (!SITE_KEY) return null;

  return (
    <div className="my-4">
      <div ref={containerRef} />
      <p className="text-[11px] text-slate-400 mt-1 text-center">
        Security check required before submitting.{' '}
        <a href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, '')}`} className="underline hover:text-slate-600 transition-colors">
          Need help? Call {PLATFORM_DEFAULTS.supportPhone}
        </a>
      </p>
    </div>
  );
}
