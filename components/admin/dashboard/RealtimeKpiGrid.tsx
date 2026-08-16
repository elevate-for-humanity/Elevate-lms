'use client';

/**
 * Wraps KpiGrid with Supabase realtime subscriptions.
 * Patches KPI values in-place as DB rows change — no full page reload needed.
 */

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { KpiGrid } from './KpiGrid';
import type { KPICard } from './types';

interface Props {
  kpis: KPICard[];
}

function patchKpi(cards: KPICard[], labelFragment: string, updater: (v: number) => number): KPICard[] {
  return cards.map((c) => {
    const label = typeof c.label === 'string' ? c.label : '';
    const value = typeof c.value === 'number' && Number.isFinite(c.value) ? c.value : 0;
    return label.toLowerCase().includes(labelFragment)
      ? { ...c, label: label || c.label, value: Math.max(0, updater(value)) }
      : { ...c, label: label || c.label, value };
  });
}

export function RealtimeKpiGrid({ kpis: initialKpis }: Props) {
  const [kpis, setKpis] = useState<KPICard[]>(initialKpis);

  useEffect(() => {
    const sb = createBrowserClient();
    let channel: ReturnType<typeof sb.channel> | null = null;

    try {
      channel = sb
        .channel('dashboard-kpi-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'program_enrollments' }, () => {
          setKpis((k) => patchKpi(k, 'learner', (v) => v + 1));
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'program_enrollments' }, (payload) => {
          const ACTIVE_STATES = ['active', 'enrolled', 'onboarding'];
          const wasActive = ACTIVE_STATES.includes(payload.old?.enrollment_state);
          const isActive = ACTIVE_STATES.includes(payload.new?.enrollment_state);
          if (!wasActive && isActive) setKpis((k) => patchKpi(k, 'learner', (v) => v + 1));
          if (wasActive && !isActive) setKpis((k) => patchKpi(k, 'learner', (v) => v - 1));

          const prev: number = payload.old?.amount_paid_cents ?? 0;
          const next: number = payload.new?.amount_paid_cents ?? 0;
          const delta = next - prev;
          if (delta > 0) setKpis((k) => patchKpi(k, 'revenue', (v) => v + delta));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, (payload) => {
          if (['pending', 'submitted'].includes(payload.new?.status)) {
            setKpis((k) => patchKpi(k, 'application', (v) => v + 1));
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, (payload) => {
          const pending = ['pending', 'submitted'];
          const wasPending = pending.includes(payload.old?.status);
          const isPending = pending.includes(payload.new?.status);
          if (!wasPending && isPending) setKpis((k) => patchKpi(k, 'application', (v) => v + 1));
          if (wasPending && !isPending) setKpis((k) => patchKpi(k, 'application', (v) => v - 1));
        })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'program_completion_certificates' },
          () => setKpis((k) => patchKpi(k, 'certificate', (v) => v + 1)),
        )
        .subscribe();
    } catch {
      return;
    }

    return () => {
      if (channel) void sb.removeChannel(channel);
    };
  }, []);

  return <KpiGrid kpis={kpis} />;
}
