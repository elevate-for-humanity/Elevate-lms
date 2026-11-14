'use client';

import React from 'react';

import { useEffect, useRef, useState } from 'react';

interface CaptchaProps {
  onVerify: (token: string) => void;
  siteKey?: string;
}

export default function Captcha({ onVerify, siteKey }: CaptchaProps) {
  const [loaded, setLoaded] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);
  const key = siteKey || process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || 'Content-key';

  useEffect(() => {
    // Load hCaptcha script
    if (typeof window !== 'undefined' && !loaded) {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => setLoaded(true);
      document.head.appendChild(script);
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && captchaRef.current && (window as string).hcaptcha) {
      (window as string).hcaptcha.render(captchaRef.current, {
        sitekey: key,
        callback: onVerify,
      });
    }
  }, [loaded, key, onVerify]);

  // If no site key, show Content
  if (key === 'Content-key') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-black">
        <p>CAPTCHA Content (configure NEXT_PUBLIC_HCAPTCHA_SITE_KEY)</p>
        <button
          type="button"
          onClick={() => onVerify('dev-bypass-token')}
          className="mt-2 rounded bg-slate-200 px-4 py-2 text-xs"
        >
          Bypass for Development
        </button>
      </div>
    );
  }

  return <div ref={captchaRef} className="h-captcha" />;
}
