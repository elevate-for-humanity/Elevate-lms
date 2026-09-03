'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, Loader2, MapPin } from 'lucide-react';

type TimeclockContext = {
  programName?: string;
  activeShift?: {
    clockInAt: string;
    lunchStartAt: string | null;
    lunchEndAt: string | null;
  } | null;
  allowedSites?: { id: string; name: string }[];
};

export function ApprenticeClockInStatus() {
  const [ctx, setCtx] = useState<TimeclockContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/timeclock/context');
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) {
            setError(data.error || 'Timeclock unavailable');
          }
          return;
        }
        if (!cancelled) setCtx(data);
      } catch {
        if (!cancelled) setError('Could not load timeclock status');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking shift status…
      </div>
    );
  }

  if (error || !ctx) {
    return (
      <p className="text-sm text-slate-600">
        <Link href="/apprentice/timeclock" className="text-brand-blue-600 font-medium hover:underline">
          Open timeclock
        </Link>{' '}
        to clock in at your work site.
      </p>
    );
  }

  const active = ctx.activeShift;
  const siteName = ctx.allowedSites?.[0]?.name;

  if (active?.clockInAt) {
    const onLunch = active.lunchStartAt && !active.lunchEndAt;
    return (
      <div className="rounded-lg border border-brand-green-200 bg-brand-green-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-1 w-2.5 h-2.5 rounded-full bg-brand-green-500 animate-pulse shrink-0" />
          <div>
            <p className="text-sm font-semibold text-brand-green-800">
              {onLunch ? 'On lunch break' : 'Currently clocked in'}
            </p>
            <p className="text-xs text-brand-green-700 mt-0.5">
              Since {new Date(active.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {siteName ? ` · ${siteName}` : ''}
            </p>
          </div>
        </div>
        <Link
          href="/apprentice/timeclock"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-800 hover:underline"
        >
          <Clock className="w-4 h-4" />
          Manage shift
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-2 text-sm text-slate-700">
        <MapPin className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
        <span>
          Not clocked in
          {siteName ? ` · ${siteName}` : ''}. Use GPS at your shop to start a shift.
        </span>
      </div>
      <Link
        href="/apprentice/timeclock"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-green-700"
      >
        <Clock className="w-4 h-4" />
        Clock in
      </Link>
    </div>
  );
}
