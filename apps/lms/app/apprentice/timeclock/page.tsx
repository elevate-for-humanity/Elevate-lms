'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ChevronRight, Clock, Loader2, MapPin } from 'lucide-react';
import { TimeclockWidget } from '@/components/timeclock/TimeclockWidget';

interface TimeclockContext {
  apprenticeId: string;
  userId: string;
  programId: string;
  programName: string;
  partnerId: string | null;
  defaultSiteId: string | null;
  allowedSites: { id: string; name: string; lat: number; lng: number; radius_m: number }[];
  hoursCompleted: number;
  hoursRequired: number;
  activeShift: {
    entryId: string;
    clockInAt: string;
    lunchStartAt: string | null;
    lunchEndAt: string | null;
    siteId: string;
  } | null;
}

export default function TimeclockPage() {
  const router = useRouter();
  const [context, setContext] = useState<TimeclockContext | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch('/api/timeclock/context', { cache: 'no-store' });
        const data = await response.json();
        if (cancelled) return;
        if (response.status === 401) {
          router.push('/login?redirect=/apprentice/timeclock');
          return;
        }
        if (!response.ok) {
          setError(
            data.code === 'NO_APPRENTICESHIP'
              ? 'You do not have an active apprenticeship. Please contact your program coordinator.'
              : data.error || 'Unable to load your timeclock.',
          );
          return;
        }
        setContext(data);
        setSelectedSiteId(data.activeShift?.siteId || data.defaultSiteId || data.allowedSites?.[0]?.id || null);
      } catch {
        setError('Unable to connect to the timeclock service.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [router]);

  const selectedSite = useMemo(
    () => context?.allowedSites.find((site) => site.id === selectedSiteId) ?? null,
    [context, selectedSiteId],
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-slate-50 flex items-center justify-center">
        <div className="text-center text-slate-700">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-brand-blue-600" />
          Loading timeclock…
        </div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-md px-4">
          <Link href="/apprentice" className="mb-6 inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-950">
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Link>
          <div className="rounded-2xl border border-brand-red-200 bg-white p-6 shadow-sm">
            <AlertTriangle className="mb-3 h-9 w-9 text-brand-red-600" />
            <h1 className="text-xl font-bold text-slate-950">Timeclock unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">{error || 'Unable to load your apprenticeship timeclock.'}</p>
            <button onClick={() => window.location.reload()} className="mt-5 rounded-lg bg-brand-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-700">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = context.hoursRequired > 0
    ? Math.min(100, Math.max(0, (context.hoursCompleted / context.hoursRequired) * 100))
    : 0;
  const hasActiveShift = Boolean(context.activeShift);

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/apprentice" className="inline-flex items-center text-sm font-semibold text-slate-700 hover:text-slate-950">
            <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
          </Link>
          <div className="flex gap-2 text-xs font-semibold">
            <Link href="/apprentice/timeclock/history" className="rounded-lg bg-white px-3 py-2 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              Shift Log
            </Link>
            <Link href="/apprentice/hours" className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              Hours <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-brand-blue-50 p-2.5 text-brand-blue-700"><Clock className="h-5 w-5" /></div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950">Apprentice Timeclock</h1>
                <p className="mt-1 text-sm text-slate-600">{context.programName}</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="mb-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold text-slate-700">Verified hours progress</span>
                <span className="font-bold text-slate-950">{context.hoursCompleted} / {context.hoursRequired}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-blue-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>

            {!hasActiveShift && context.allowedSites.length > 1 && (
              <label className="block">
                <span className="mb-2 flex items-center text-sm font-semibold text-slate-800"><MapPin className="mr-1.5 h-4 w-4" /> Work site</span>
                <select
                  value={selectedSiteId || ''}
                  onChange={(event) => setSelectedSiteId(event.target.value || null)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-950 focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-200"
                >
                  <option value="">Select a work site</option>
                  {context.allowedSites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </label>
            )}

            {selectedSite && (
              <p className="mt-3 flex items-center text-sm text-slate-600">
                <MapPin className="mr-1.5 h-4 w-4 text-brand-blue-600" />
                Assigned site: <strong className="ml-1 text-slate-900">{selectedSite.name}</strong>
              </p>
            )}

            {!selectedSite && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                No approved work site is assigned. Contact your program coordinator before attempting attendance.
              </div>
            )}
          </div>
        </section>

        {selectedSiteId && selectedSite ? (
          <TimeclockWidget
            key={`${selectedSiteId}:${context.activeShift?.entryId ?? 'new'}`}
            apprenticeId={context.apprenticeId}
            partnerId={context.partnerId}
            programId={context.programId}
            siteId={selectedSiteId}
            siteName={selectedSite.name}
            initialShift={context.activeShift ? {
              entryId: context.activeShift.entryId,
              clockInAt: context.activeShift.clockInAt,
              lunchStartAt: context.activeShift.lunchStartAt,
              lunchEndAt: context.activeShift.lunchEndAt,
            } : null}
          />
        ) : null}

        <p className="mt-5 text-xs leading-5 text-slate-500">
          GPS attendance is accepted only after server verification against your authenticated apprentice account and assigned host-site geofence. Offline events remain pending until that verification succeeds.
        </p>
      </div>
    </div>
  );
}
