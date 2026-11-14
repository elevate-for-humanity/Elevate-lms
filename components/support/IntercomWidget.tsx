'use client';

import React from 'react';

import { useEffect } from 'react';

// Intercom window type
interface IntercomWindow {
  Intercom?: (...args: unknown[]) => void;
}

export function IntercomWidget({ user }: { user?: { id: string; email: string; name?: string } }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_INTERCOM_APP_ID) return;

    const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

    (function () {
      const w = window as unknown as IntercomWindow;
      const ic = w.Intercom;
      if (typeof ic === 'function') {
        ic('reattach_activator');
        ic('update', {});
      } else {
        const d = document;
        const i = function (...args: unknown[]) {
          i.c(args);
        };
        i.q = [];
        i.c = function (args: unknown[]) {
          i.q.push(args);
        };
        w.Intercom = i;
        function l() {
          const s = d.createElement('script');
          s.type = 'text/javascript';
          s.async = true;
          s.src = `https://widget.intercom.io/widget/${appId}`;
          const x = d.getElementsByTagName('script')[0];
          x.parentNode?.insertBefore(s, x);
        }
        if (document.readyState === 'complete') {
          l();
        } else {
          w.addEventListener('load', l);
        }
      }
    })();

    if (user && window.Intercom) {
      window.Intercom('boot', {
        app_id: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
        user_id: user.id,
        email: user.email,
        name: user.name,
      });
    }

    return () => {
      if (window.Intercom) {
        window.Intercom('shutdown');
      }
    };
  }, [user]);

  return null;
}
declare global {
  interface Window {
    Intercom?: (...args: unknown[]) => void;
  }
}
