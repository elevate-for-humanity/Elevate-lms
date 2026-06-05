'use client';

/**
 * useRealtimeMetrics
 *
 * Subscribes to Supabase realtime + polls /api/admin/platform-health every 30s.
 * Returns a live snapshot of operational metrics for the global status bar.
 *
 * Designed to be mounted once in the admin layout — all consumers share the
 * same subscription via React context (see RealtimeMetricsProvider).
 */

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

export interface RealtimeMetrics {
  /** Northflank runtime health (from platform-health overall): 'healthy' | 'degraded' | 'down' | 'unknown' */
  hosting: 'healthy' | 'degraded' | 'down' | 'unknown';
  /** Active enrollments count */
  enrollments: number;
  /** Pending applications count */
  applications: number;
  /** AI provider status */
  aiQueue: 'ok' | 'degraded' | 'down' | 'unknown';
  /** Count of unresolved failures (cron, email, etc.) */
  failures: number;
  /** Active deployments in progress */
  deployments: number;
  /** Last updated timestamp */
  updatedAt: Date;
}

const INITIAL: RealtimeMetrics = {
  hosting: 'unknown',
  enrollments: 0,
  applications: 0,
  aiQueue: 'unknown',
  failures: 0,
  deployments: 0,
  updatedAt: new Date(),
};

export function useRealtimeMetrics(): RealtimeMetrics {
  const [metrics, setMetrics] = useState<RealtimeMetrics>(INITIAL);

  // ── Platform health poll (30s) ─────────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/platform-health', { cache: 'no-store' });
      if (!res.ok) return;
      const h = await res.json();

      setMetrics(prev => ({
        ...prev,
        hosting:
          h.services?.hosting?.status === 'healthy'
            ? 'healthy'
            : h.services?.hosting?.status === 'degraded'
              ? 'degraded'
              : h.overall === 'healthy'
                ? 'healthy'
                : h.overall === 'degraded'
                  ? 'degraded'
                  : 'unknown',
        aiQueue:  h.ai?.activeProvider ? 'ok' : 'degraded',
        failures: h.services?.email?.failedToday ?? 0,
        updatedAt: new Date(),
      }));
    } catch {
      // non-fatal — keep last known state
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  // ── Supabase realtime — enrollment + application counts ───────────────────
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const sb = createClient(url, key);

    // Seed initial counts
    Promise.all([
      sb.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      sb.from('applications').select('*', { count: 'exact', head: true }).in('status', ['pending', 'submitted']),
    ]).then(([enr, app]) => {
      setMetrics(prev => ({
        ...prev,
        enrollments:  enr.count ?? prev.enrollments,
        applications: app.count ?? prev.applications,
      }));
    }).catch(() => {});

    const channel = sb.channel('global-metrics')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'program_enrollments' }, () => {
        setMetrics(prev => ({ ...prev, enrollments: prev.enrollments + 1 }));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'program_enrollments' }, (p) => {
        const wasActive = p.old?.status === 'active';
        const isActive  = p.new?.status === 'active';
        if (!wasActive && isActive)  setMetrics(prev => ({ ...prev, enrollments: prev.enrollments + 1 }));
        if (wasActive  && !isActive) setMetrics(prev => ({ ...prev, enrollments: Math.max(0, prev.enrollments - 1) }));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, (p) => {
        if (['pending', 'submitted'].includes(p.new?.status)) {
          setMetrics(prev => ({ ...prev, applications: prev.applications + 1 }));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, (p) => {
        const pending = ['pending', 'submitted'];
        const wasPending = pending.includes(p.old?.status);
        const isPending  = pending.includes(p.new?.status);
        if (!wasPending && isPending)  setMetrics(prev => ({ ...prev, applications: prev.applications + 1 }));
        if (wasPending  && !isPending) setMetrics(prev => ({ ...prev, applications: Math.max(0, prev.applications - 1) }));
      })
      .subscribe();

    return () => { sb.removeChannel(channel); };
  }, []);

  return metrics;
}
