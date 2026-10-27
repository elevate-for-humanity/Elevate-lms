'use client';
import { useEffect, useState } from 'react';
import {
  ALERT_SOUNDS,
  DEFAULT_PWA_ALERTS,
  normalizeAlertSettings,
  type PwaAlertSettings as Settings,
} from '@/lib/notifications/pwa-alert-settings';
import { playAlert } from '@/lib/notifications/alert-audio';
export const ALERT_SETTINGS_EVENT = 'elevate-alert-settings';
export function PwaAlertSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_PWA_ALERTS),
    [status, setStatus] = useState('Loading alert settings…'),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState(''),
    [ready, setReady] = useState(false),
    [isAdmin, setIsAdmin] = useState(false),
    [permission, setPermission] = useState('default');
  useEffect(() => {
    let active = true;
    fetch('/api/notifications/preferences', { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error || 'Alert settings unavailable');
        if (active) {
          setSettings(normalizeAlertSettings(d.settings));
          setKey(d.pushConfigured ? d.publicKey || '' : '');
          setReady(true);
          setIsAdmin(d.isAdmin === true);
          setStatus(
            d.pushConfigured
              ? ''
              : 'Background push is not configured. Sounds still work while the PWA is open.',
          );
          setPermission('Notification' in window ? Notification.permission : 'unsupported');
        }
      })
      .catch((e) => {
        if (active) setStatus(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(next = settings) {
    setBusy(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Settings could not be saved');
      setSettings(normalizeAlertSettings(data.settings));
      window.dispatchEvent(new CustomEvent(ALERT_SETTINGS_EVENT));
      setStatus('Alert settings saved.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }
  async function enable() {
    setBusy(true);
    try {
      if (
        !('Notification' in window) ||
        !('serviceWorker' in navigator) ||
        !('PushManager' in window)
      )
        throw Error(
          'Install the PWA on your Home Screen or use a browser that supports notifications.',
        );
      if (!key) throw Error('Background push is not configured on the server.');
      const allowed = await Notification.requestPermission();
      setPermission(allowed);
      if (allowed !== 'granted')
        throw Error(
          'Notifications were not allowed. You can change this in your browser or device settings.',
        );
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(Error('PWA service worker is not ready. Refresh once and try again.')),
            10000,
          ),
        ),
      ]);
      const bytes = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
        c.charCodeAt(0),
      );
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        }));
      const response = await fetch('/api/notifications/device', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Device registration failed');
      await save({ ...settings, enabled: true });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Notification setup failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="PWA alerts and sounds"
      className="rounded-xl border border-slate-300 bg-white p-5 text-slate-950 space-y-4"
    >
      <h2 className="text-xl font-bold">PWA alerts and sounds</h2>
      <p>
        Choose what PARIS announces. Background alerts are checked about every five minutes. Your
        choices are saved to your account. Enable notifications on each device you use.
      </p>
      {(
        [
          'enabled',
          'email_alerts',
          'student_sign_in',
          'student_sign_out',
          'student_inactive',
        ] as const
      )
        .filter((_, index) => isAdmin || index < 2)
        .map((field, index) => (
          <label key={field} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings[field]}
              onChange={(e) => setSettings({ ...settings, [field]: e.target.checked })}
            />
            {
              [
                'Alerts enabled',
                'New email',
                'Recorded student sign-in',
                'Recorded student sign-out',
                'Student inactivity warning',
              ][index]
            }
          </label>
        ))}
      {isAdmin && (
        <label className="block">
          Inactivity threshold (days)
          <input
            aria-label="Inactivity threshold (days)"
            type="number"
            min={14}
            max={90}
            value={settings.inactive_days}
            onChange={(e) => setSettings({ ...settings, inactive_days: Number(e.target.value) })}
            className="ml-3 rounded border p-2"
          />
        </label>
      )}
      <label className="block">
        Alert sound
        <select
          aria-label="Alert sound"
          value={settings.sound}
          onChange={(e) => setSettings({ ...settings, sound: e.target.value as Settings['sound'] })}
          className="ml-3 rounded border p-2"
        >
          {ALERT_SOUNDS.map((sound) => (
            <option key={sound} value={sound}>
              {sound === 'voice' ? 'PARIS spoken alert' : sound[0].toUpperCase() + sound.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Volume: {Math.round(settings.volume * 100)}%
        <input
          aria-label="Alert volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.volume}
          onChange={(e) => setSettings({ ...settings, volume: Number(e.target.value) })}
        />
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy || !ready}
          onClick={() => void save()}
          className="rounded bg-blue-700 px-4 py-3 text-white disabled:opacity-50"
        >
          Save alert settings
        </button>
        <button
          type="button"
          onClick={() =>
            void playAlert(settings)
              .then(() => setStatus('Sound preview requested.'))
              .catch((e) => setStatus(e.message))
          }
          className="rounded border border-slate-400 px-4 py-3"
        >
          Test sound
        </button>
        <button
          type="button"
          disabled={busy || !ready}
          onClick={() => void enable()}
          className="rounded border border-slate-400 px-4 py-3 disabled:opacity-50"
        >
          Enable notifications on this device
        </button>
      </div>
      <p>
        Device permission: {permission}. Custom chimes and spoken alerts play while the PWA is open
        after you allow audio. When it is closed, your operating system controls background
        notification sounds. Silent mutes in-app audio and requests quiet background alerts; your
        device has final control. General messages are spoken; names and email content are not read
        aloud.
      </p>
      <p role="status">{status}</p>
    </section>
  );
}
