'use client';

import { createClient } from '@/lib/supabase/client';

import { useEffect, useRef, useCallback } from 'react';

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

  // Log turnstile verification to DB
  const logTurnstileEvent = async (eventType: 'verified' | 'error' | 'expired', token?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('turnstile_verifications')
      .insert({
        user_id: user?.id,
        form_id: formId,
        event_type: eventType,
        token_prefix: token?.substring(0, 20),
        timestamp: new Date().toISOString()
      });
  };

  const handleVerify = (token: string) => {
    logTurnstileEvent('verified', token);
    onVerify(token);
  };

  const handleError = () => {
    logTurnstileEvent('error');
    onError?.();
  };

  const handleExpire = () => {
    logTurnstileEvent('expired');
    onExpire?.();
  };

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile || !SITE_KEY) return;
    
    // Remove existing widget if any
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current);
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: handleVerify,
      'error-callback': handleError,
      'expired-callback': handleExpire,
      theme: 'light',
    });
  }, [onVerify, onError, onExpire]);

  useEffect(() => {
    // Skip if no site key configured
    if (!SITE_KEY) {
      // In development without key, auto-verify
      onVerify('dev-mode-token');
      return;
    }

    // Load Turnstile script if not already loaded
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
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [renderWidget, onVerify]);

  // Don't render anything if no site key
  if (!SITE_KEY) {
    return null;
  }

  return <div ref={containerRef} className="my-4" />;
}
