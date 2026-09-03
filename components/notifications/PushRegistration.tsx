'use client';

/**
 * PushRegistration
 *
 * Mounts in the LMS app shell for authenticated users. Handles the full
 * push subscription lifecycle:
 *
 * 1. If permission is already 'granted' and no subscription exists → subscribe silently.
 * 2. If permission is 'default' and the user hasn't been prompted in the last 7 days
 *    → show a non-blocking banner after 30s asking to enable notifications.
 * 3. If permission is 'denied' → do nothing.
 *
 * Subscription is persisted to /api/push/subscribe (upsert on user_id+endpoint).
 * VAPID public key comes from NEXT_PUBLIC_VAPID_PUBLIC_KEY.
 */

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
const PROMPT_COOLDOWN_DAYS = 7;
const PROMPT_DELAY_MS = 30_000; // 30s after mount

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (!VAPID_PUBLIC_KEY) return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    });

    return true;
  } catch {
    return false;
  }
}

export function PushRegistration() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (!VAPID_PUBLIC_KEY) return;

    const permission = Notification.permission;

    if (permission === 'granted') {
      // Already granted — subscribe silently (idempotent upsert)
      subscribeToPush().catch(() => {});
      return;
    }

    if (permission === 'denied') return;

    // permission === 'default' — check cooldown before showing banner
    const lastPrompt = localStorage.getItem('elevate-push-prompt-at');
    if (lastPrompt) {
      const daysSince = (Date.now() - parseInt(lastPrompt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < PROMPT_COOLDOWN_DAYS) return;
    }

    const timer = setTimeout(() => setShowBanner(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setShowBanner(false);
    localStorage.setItem('elevate-push-prompt-at', String(Date.now()));
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      subscribeToPush().catch(() => {});
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('elevate-push-prompt-at', String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-auto px-4">
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-start gap-3">
        <Bell className="w-5 h-5 text-brand-blue-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Enable notifications</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Get alerts for new lessons, grades, and important updates.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleEnable}
              className="text-xs bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Enable
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-slate-400 hover:text-white px-2 py-1.5 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-white mt-0.5 shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
