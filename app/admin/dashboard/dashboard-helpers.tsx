'use client';

import { useEffect, useState } from 'react';
import { useMounted } from '@/lib/useMounted';

export const COLORS = ['#2563eb','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#6366f1'];
export const STATUS_COLORS: Record<string, string> = {
  active:'#10b981', enrolled:'#2563eb', pending:'#f59e0b', completed:'#8b5cf6',
  at_risk:'#ef4444', applied:'#06b6d4', in_progress:'#6366f1', none:'#9ca3af',
};
export const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function AnimatedCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const mounted = useMounted();
  const [count, setCount] = useState(target);
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    setPrefersReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);
  }, []);

  useEffect(() => {
    if (prefersReduced) { setCount(target); return; }
    let start = 0;
    setCount(0);
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, prefersReduced]);

  return <span>{count.toLocaleString('en-US')}</span>;
}

export function StatusDot({ color }: { color: string }) {
  return <span className="inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: color }} />;
}

export function EmptyState({ icon: Icon, title, subtitle, href, linkText }: {
  icon: React.ElementType; title: string; subtitle: string; href?: string; linkText?: string;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <Icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      {href && linkText && (
        <a href={href} className="inline-block mt-3 text-xs text-brand-blue-600 hover:text-brand-blue-700 font-medium">{linkText}</a>
      )}
    </div>
  );
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
