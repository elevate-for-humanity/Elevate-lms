'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, Smartphone, ExternalLink } from 'lucide-react';
import {
  BARBER_STUDENT_APP_HOME,
  BARBER_STUDENT_APP_LABEL,
} from '@/lib/barber/student-app';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Props {
  /** compact = quick-action row; card = dashboard promo block */
  variant?: 'compact' | 'card';
  accentText?: string;
}

export function BarberStudentAppDownload({
  variant = 'card',
  accentText = 'text-amber-600',
}: Props) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } finally {
      setInstalling(false);
    }
  };

  if (isStandalone) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <Link
        href={BARBER_STUDENT_APP_HOME}
        className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
      >
        <Smartphone className={`w-5 h-5 ${accentText}`} />
        <div>
          <p className="font-semibold text-sm text-slate-900">{BARBER_STUDENT_APP_LABEL}</p>
          <p className="text-xs text-slate-500">Clock in, hours &amp; training on your phone</p>
        </div>
      </Link>
    );
  }

  return (
    <section className="rounded-xl border border-brand-blue-200 bg-brand-blue-50 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-11 h-11 rounded-xl bg-brand-blue-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Download the {BARBER_STUDENT_APP_LABEL}</h2>
            <p className="text-xs text-slate-600 mt-1">
              Clock in at your shop with GPS verification, log hours, and open Prestige Elevation
              coursework from your phone. Add to your home screen — works like a native app.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              On iPhone: open the link in Safari, tap Share, then &quot;Add to Home Screen&quot;.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          {installPrompt ? (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {installing ? 'Installing…' : 'Install App'}
            </button>
          ) : null}
          <Link
            href={BARBER_STUDENT_APP_HOME}
            className="inline-flex items-center justify-center gap-2 border border-brand-blue-600 bg-white text-brand-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-blue-100/50"
          >
            <ExternalLink className="w-4 h-4" />
            Open App
          </Link>
        </div>
      </div>
    </section>
  );
}
