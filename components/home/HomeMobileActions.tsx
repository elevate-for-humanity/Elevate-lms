'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Download, Phone, SearchCheck } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function HomeMobileActions() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) {
      window.location.assign('/mobile-app');
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-2 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      aria-label="Quick actions"
    >
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
        <Link
          href="/check-eligibility"
          className="inline-flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl bg-brand-red-600 px-2 py-2 text-center text-xs font-black text-white"
        >
          <SearchCheck className="h-5 w-5" aria-hidden="true" />
          Eligibility
        </Link>
        <button
          type="button"
          onClick={() => void installApp()}
          className="inline-flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl bg-emerald-700 px-2 py-2 text-center text-xs font-black text-white"
          aria-label={installPrompt ? 'Install the Elevate app' : 'Open Elevate app installation instructions'}
        >
          <Download className="h-5 w-5" aria-hidden="true" />
          Install App
        </button>
        <a
          href="tel:+13173143757"
          className="inline-flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-xl border-2 border-slate-300 bg-white px-2 py-2 text-center text-xs font-black text-slate-900"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          Call Elevate
        </a>
      </div>
    </div>
  );
}

export default HomeMobileActions;
