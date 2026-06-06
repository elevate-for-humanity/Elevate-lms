'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Activity, FileClock, DollarSign, Award } from 'lucide-react';
import type { KPICard } from './types';

function fmtCents(cents: number) {
  const dollars = cents / 100;
  return dollars >= 1000
    ? '$' + (dollars / 1000).toFixed(1) + 'k'
    : '$' + dollars.toLocaleString('en-US');
}
function fmt(n: number) {
  return new Intl.NumberFormat('en-US').format(n);
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  fileclock: FileClock,
  dollar: DollarSign,
  award: Award,
};

function iconKeyFor(label: string): string {
  const l = label.toLowerCase();
  if (l.includes('learner') || l.includes('student')) return 'activity';
  if (l.includes('application')) return 'fileclock';
  if (l.includes('revenue')) return 'dollar';
  return 'award';
}

/** Animates a number from 0 to target over ~600ms */
function useCountUp(target: number) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const duration = 600;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  return display;
}

function KpiCard({ card }: { card: KPICard }) {
  const pos = card.delta >= 0;
  const label = typeof card.label === 'string' ? card.label : 'Metric';
  const deltaLabel = typeof card.deltaLabel === 'string' ? card.deltaLabel : '';
  const IconComponent = ICON_MAP[iconKeyFor(label)] ?? Award;
  const isRevenue = label.toLowerCase().includes('revenue');
  const animated = useCountUp(typeof card.value === 'number' ? card.value : 0);

  return (
    <Link
      href={card.href}
      className={[
        'group relative overflow-hidden rounded-2xl border bg-white',
        'shadow-sm hover:shadow-lg hover:-translate-y-0.5',
        'transition-all duration-200 ease-out',
        card.urgent
          ? 'border-rose-300'
          : 'border-slate-200',
      ].join(' ')}
    >
      {/* Top accent bar */}
      <div
        className={[
          'h-1 transition-all duration-300 group-hover:h-1.5',
          card.urgent ? 'bg-rose-500' : 'bg-gradient-to-r from-brand-blue-500 to-cyan-400',
        ].join(' ')}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 truncate mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {isRevenue ? fmtCents(animated) : fmt(animated)}
            </p>
          </div>
          <div
            className={[
              'rounded-xl p-2.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
              card.urgent
                ? 'bg-rose-50 text-rose-600'
                : 'bg-slate-100 text-slate-600',
            ].join(' ')}
          >
            <IconComponent className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {card.delta !== 0 && deltaLabel.includes('%') && (
            <span
              className={[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                pos
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700',
              ].join(' ')}
            >
              {pos ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {Math.abs(card.delta)}%
            </span>
          )}
          {deltaLabel ? <span className="text-xs text-slate-500">{deltaLabel}</span> : null}
        </div>
      </div>

      {/* Urgent pulse */}
      {card.urgent && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
      )}

      {/* Hover shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />
    </Link>
  );
}

export function KpiGrid({ kpis }: { kpis: KPICard[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {kpis.map((card) => (
        <KpiCard key={card.label} card={card} />
      ))}
    </section>
  );
}
