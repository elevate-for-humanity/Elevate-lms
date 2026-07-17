'use client';

import { useEffect, useState } from 'react';
import { Smartphone, Monitor, Download, CheckCircle, Chrome, Apple } from 'lucide-react';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function AdminInstallClient() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [desktopBrowser, setDesktopBrowser] = useState<
    'chrome' | 'edge' | 'safari' | 'firefox' | 'other'
  >('other');

  useEffect(() => {
    // Already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
      return;
    }

    // Detect platform
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) setPlatform('ios');
    else if (/Android/.test(ua)) setPlatform('android');
    else {
      setPlatform('desktop');

      if (/Edg\//.test(ua)) setDesktopBrowser('edge');
      else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) setDesktopBrowser('chrome');
      else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) setDesktopBrowser('safari');
      else if (/Firefox\//.test(ua)) setDesktopBrowser('firefox');
      else setDesktopBrowser('other');
    }

    // Capture install prompt (Chrome/Edge/Android)
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as DeferredPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  }

  if (isStandalone || installed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-brand-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin App Installed</h1>
          <p className="text-slate-400 mb-6">Open it from your home screen or app drawer.</p>
          <a
            href="/login?redirect=%2Fadmin%2Fdashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Open Admin Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
            <span className="text-4xl font-black text-slate-900">E</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-1">Elevate Admin</h1>
        <p className="text-slate-400 text-center text-sm mb-8">
          Install the admin app for fast access on any device.
        </p>

        {/* Chrome/Android/Desktop — native install prompt available */}
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-colors mb-4 text-base"
          >
            <Download className="w-5 h-5" />
            Install App
          </button>
        )}

        {/* iOS — no beforeinstallprompt, show manual instructions */}
        {platform === 'ios' && !deferredPrompt && (
          <div className="bg-slate-800 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-5 h-5 text-white" />
              <p className="text-white font-semibold text-sm">Install on iPhone / iPad</p>
            </div>
            <ol className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-mono text-xs mt-0.5">1.</span>
                Tap the <strong className="text-white">Share</strong> button in Safari (box with arrow)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-mono text-xs mt-0.5">2.</span>
                Scroll down and tap <strong className="text-white">Add to Home Screen</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 font-mono text-xs mt-0.5">3.</span>
                Tap <strong className="text-white">Add</strong> — the app appears on your home screen
              </li>
            </ol>
          </div>
        )}

        {/* Desktop fallback when install prompt is unavailable */}
        {platform === 'desktop' && !deferredPrompt && (
          <div className="bg-slate-800 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Chrome className="w-5 h-5 text-white" />
              <p className="text-white font-semibold text-sm">Install on Desktop ({desktopBrowser === 'edge' ? 'Edge' : desktopBrowser === 'chrome' ? 'Chrome' : desktopBrowser === 'safari' ? 'Safari' : desktopBrowser === 'firefox' ? 'Firefox' : 'Browser'})</p>
            </div>
            <ol className="space-y-2 text-slate-300 text-sm">
              {desktopBrowser === 'chrome' || desktopBrowser === 'edge' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">1.</span>
                    Look for the <strong className="text-white">Install app</strong> icon in the address bar.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">2.</span>
                    Click it and select <strong className="text-white">Install</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">3.</span>
                    If you do not see the icon, open browser menu <strong className="text-white">...</strong> → <strong className="text-white">Install Elevate Admin</strong>.
                  </li>
                </>
              ) : desktopBrowser === 'safari' ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">1.</span>
                    Safari on desktop does not support installable web apps the same way as Chrome/Edge.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">2.</span>
                    For app-style install, open this page in <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">3.</span>
                    Continue in browser now using the button below.
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">1.</span>
                    Open this page in <strong className="text-white">Chrome</strong> or <strong className="text-white">Edge</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">2.</span>
                    Use the <strong className="text-white">Install app</strong> icon in the address bar, or browser menu.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-500 font-mono text-xs mt-0.5">3.</span>
                    If install is blocked by policy, use browser mode from the button below.
                  </li>
                </>
              )}
            </ol>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500 hover:text-white transition-colors"
            >
              Refresh install check
            </button>
          </div>
        )}

        {/* Direct link fallback */}
        <a
          href="/login?redirect=%2Fadmin%2Fdashboard"
          className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 font-medium rounded-2xl hover:border-slate-500 hover:text-white transition-colors text-sm"
        >
          Open in browser instead
        </a>

        {/* What's included */}
        <div className="mt-8 space-y-3">
          {[
            { icon: Smartphone, label: 'Works offline — view reports without internet' },
            { icon: Monitor, label: 'Full admin dashboard — participants, reports, WIOA' },
            { icon: CheckCircle, label: 'Fast launch — no browser chrome, no login delay' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <p className="text-slate-400 text-xs">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-slate-600 text-xs text-center mt-8">
          This page is not publicly listed. Share only with authorized administrators.
        </p>
      </div>
    </div>
  );
}
