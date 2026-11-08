'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  alertKind,
  alertPresentation,
  DEFAULT_PWA_ALERTS,
  normalizeAlertSettings,
} from '@/lib/notifications/pwa-alert-settings';
import { playAlert } from '@/lib/notifications/alert-audio';
export function PwaAlertListener({ authenticatedUserId }: { authenticatedUserId?: string } = {}) {
  const [connectionError, setConnectionError] = useState(false);
  useEffect(() => {
    const db = createClient();
    const reads = new AbortController();
    let stopped = false,
      channel: any,
      userId = '',
      settings = DEFAULT_PWA_ALERTS,
      since = new Date().toISOString(),
      polling = false,
      lastAudioAt = 0;
    async function refresh() {
      try {
        const r = await fetch('/api/notifications/preferences', { cache: 'no-store', signal: reads.signal });
        if (r.ok) {
          const data = await r.json();
          settings = normalizeAlertSettings(data.settings);
        }
      } catch {
        /* Saved preferences are refreshed on the next focus. */
      }
    }
    async function announce(row: any) {
      const kind = alertKind(row);
      if (
        !kind ||
        !settings.enabled ||
        !(kind === 'email'
          ? settings.email_alerts
          : kind === 'sign_in'
            ? settings.student_sign_in
            : kind === 'sign_out'
              ? settings.student_sign_out
              : settings.student_inactive)
      )
        return;
      const sound = async () => {
        const key = `elevate-alert-seen:${userId}`;
        let seen: string[] = [];
        try {
          seen = JSON.parse(localStorage.getItem(key) || '[]');
        } catch {
          seen = [];
        }
        if (seen.includes(row.id)) return;
        // Never replay the same event after a realtime delivery and polling fallback.
        const eventKey = `elevate-alert-seen:${userId}:${row.id}`;
        if (sessionStorage.getItem(eventKey)) return;
        sessionStorage.setItem(eventKey, '1');
        localStorage.setItem(key, JSON.stringify([...seen, row.id].slice(-100)));
        if (Date.now() - lastAudioAt < 2500) return;
        lastAudioAt = Date.now();
        try {
          const preview = alertPresentation(row, kind);
          await playAlert(
            settings,
            kind,
            `You have a message from Elevate for Humanity. ${preview.title}. ${preview.body}`,
          );
        } catch {
          /* Device autoplay can require Test sound after reopening. */
        }
      };
      if (navigator.locks) await navigator.locks.request('elevate-pwa-alert-audio', sound);
      else await sound();
    }
    async function poll() {
      if (stopped || !userId || polling) return;
      polling = true;
      try {
        const { data, error } = await db
          .from('notifications')
          .select('id,title,message,metadata,idempotency_key,created_at')
          .eq('user_id', userId)
          .gt('created_at', since)
          .order('created_at', { ascending: true })
          .limit(50)
          .abortSignal(reads.signal);
        if (stopped) return;
        setConnectionError(Boolean(error));
        if (!error && data)
          for (const row of data) {
            await announce(row);
            if (row.created_at > since) since = row.created_at;
          }
      } catch {
        if (!stopped) setConnectionError(true);
      } finally {
        polling = false;
      }
    }
    setConnectionError(false);
    void (async () => {
      // CommunicationTodos has already verified this identity with getUser.
      // Reuse it instead of starting another auth request as the page navigates.
      // Standalone listeners still verify their own user; database RLS remains
      // the authority for every notification read and realtime subscription.
      let verifiedUserId = authenticatedUserId;
      if (!verifiedUserId) {
        const { data: { user }, error } = await db.auth.getUser();
        if (error) throw error;
        verifiedUserId = user?.id;
      }
      if (stopped || !verifiedUserId) return;
      userId = verifiedUserId;
      await refresh();
      if (stopped) return;
      channel = db
        .channel(`pwa-alerts:${verifiedUserId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${verifiedUserId}`,
          },
          (payload: any) => void announce(payload.new),
        )
        .subscribe();
    })().catch(() => {
      if (!stopped) setConnectionError(true);
    });
    const timer = setInterval(() => void poll(), 30000);
    const onFocus = () => {
      void refresh();
      void poll();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('elevate-alert-settings', refresh);
    return () => {
      stopped = true;
      reads.abort();
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('elevate-alert-settings', refresh);
      if (channel) void db.removeChannel(channel);
    };
  }, [authenticatedUserId]);
  return connectionError
    ? <p role="status">Notification alerts are temporarily unavailable. Please refresh to reconnect.</p>
    : null;
}
