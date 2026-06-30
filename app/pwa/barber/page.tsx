'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  Scissors,
  Clock,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Loader2,
  LogIn,
  LogOut,
  Award,
  ChevronRight,
} from 'lucide-react';

interface DashboardData {
  fullName: string | null;
  ojlHours: number;
  rtiHours: number;
  requiredOjl: number;
  requiredRti: number;
  isClockedIn: boolean;
  activeSessionStart: string | null;
  onboardingComplete: boolean;
  pendingOnboardingCount: number;
  programSlug: string | null;
}

const REQUIRED_OJL = 1500;
const REQUIRED_RTI = 500;

export default function BarberPWAHome() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockingIn, setClockingIn] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const load = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.replace('/login?redirect=/pwa/barber');
      return;
    }

    const userId = session.user.id;

    // Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .maybeSingle();

    // Active enrollment
    const { data: enrollment } = await supabase
      .from('program_enrollments')
      .select('program_slug, orientation_completed_at, documents_submitted_at, stripe_subscription_id')
      .eq('user_id', userId)
      .eq('enrollment_state', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Approved hours
    const { data: hourRows } = await supabase
      .from('hour_entries')
      .select('hours_claimed, accepted_hours, source_type')
      .eq('user_id', userId)
      .in('status', ['approved', 'locked']);

    const OJL_TYPES = new Set(['ojl', 'host_shop', 'timeclock', 'manual']);
    const RTI_TYPES = new Set(['rti', 'in_state_barber_school', 'continuing_education']);
    let ojl = 0;
    let rti = 0;
    for (const row of hourRows ?? []) {
      const hrs = Number(row.accepted_hours) || Number(row.hours_claimed) || 0;
      if (OJL_TYPES.has(row.source_type)) ojl += hrs;
      else if (RTI_TYPES.has(row.source_type)) rti += hrs;
    }

    // Active timeclock session
    const { data: activeSession } = await supabase
      .from('timeclock_sessions')
      .select('id, clock_in_at')
      .eq('user_id', userId)
      .is('clock_out_at', null)
      .order('clock_in_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Onboarding
    const { data: docs } = await supabase
      .from('documents')
      .select('document_type, status')
      .eq('user_id', userId);

    const hasPhotoId = (docs ?? []).some((d) => d.document_type === 'photo_id');
    const hasResidency = (docs ?? []).some(
      (d) => d.document_type === 'proof_of_residency' || d.document_type === 'other',
    );
    const docsApproved =
      (docs ?? []).length > 0 && (docs ?? []).every((d) => d.status === 'approved');
    const hasPayment = !!enrollment?.stripe_subscription_id;

    const onboardingItems = [
      !!enrollment?.orientation_completed_at,
      hasPhotoId,
      hasResidency,
      docsApproved,
      hasPayment,
    ];
    const pendingOnboardingCount = onboardingItems.filter((v) => !v).length;

    setData({
      fullName: profile?.full_name ?? null,
      ojlHours: ojl,
      rtiHours: rti,
      requiredOjl: REQUIRED_OJL,
      requiredRti: REQUIRED_RTI,
      isClockedIn: !!activeSession,
      activeSessionStart: activeSession?.clock_in_at ?? null,
      onboardingComplete: pendingOnboardingCount === 0,
      pendingOnboardingCount,
      programSlug: enrollment?.program_slug ?? null,
    });
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const handleClockToggle = async () => {
    setClockingIn(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    if (data?.isClockedIn) {
      // Clock out — close the open session
      await supabase
        .from('timeclock_sessions')
        .update({ clock_out_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .is('clock_out_at', null);
    } else {
      // Clock in — open a new session
      await supabase.from('timeclock_sessions').insert({
        user_id: session.user.id,
        clock_in_at: new Date().toISOString(),
        program_slug: data?.programSlug ?? 'barber-apprenticeship',
        source: 'pwa',
      });
    }

    setClockingIn(false);
    load();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const ojlPercent = Math.min((data.ojlHours / data.requiredOjl) * 100, 100);
  const rtiPercent = Math.min((data.rtiHours / data.requiredRti) * 100, 100);
  const firstName = data.fullName?.split(' ')[0] ?? 'Apprentice';

  return (
    <div className="min-h-screen bg-slate-900 pb-24">
      {/* Header */}
      <header className="bg-slate-800 px-4 pt-12 pb-5 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Barber Apprenticeship</p>
              <h1 className="text-white font-bold text-lg leading-tight">
                Hey, {firstName}
              </h1>
            </div>
          </div>
          {data.isClockedIn && (
            <span className="flex items-center gap-1.5 bg-brand-green-500/20 text-brand-green-400 text-xs font-semibold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-brand-green-400 rounded-full animate-pulse" />
              Clocked In
            </span>
          )}
        </div>
      </header>

      <main className="px-4 py-5 space-y-4">
        {/* Onboarding alert */}
        {!data.onboardingComplete && (
          <Link
            href="/pwa/barber/onboarding"
            className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-amber-300 font-semibold text-sm">
                {data.pendingOnboardingCount} onboarding{' '}
                {data.pendingOnboardingCount === 1 ? 'step' : 'steps'} remaining
              </p>
              <p className="text-amber-500 text-xs mt-0.5">Tap to complete →</p>
            </div>
          </Link>
        )}

        {/* Clock in/out card */}
        <div className="bg-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-3">
            Timeclock
          </p>
          <button
            onClick={handleClockToggle}
            disabled={clockingIn}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base transition disabled:opacity-50 ${
              data.isClockedIn
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-amber-500 text-white hover:bg-amber-400'
            }`}
          >
            {clockingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : data.isClockedIn ? (
              <>
                <LogOut className="w-5 h-5" /> Clock Out
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" /> Clock In
              </>
            )}
          </button>
          {data.isClockedIn && data.activeSessionStart && (
            <p className="text-center text-slate-500 text-xs mt-2">
              Session started{' '}
              {new Date(data.activeSessionStart).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Hours progress */}
        <div className="bg-slate-800 rounded-2xl p-5 space-y-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">
            Hours Progress
          </p>

          {/* OJL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white text-sm font-medium">On-the-Job (OJL)</span>
              <span className="text-slate-400 text-sm tabular-nums">
                {data.ojlHours.toLocaleString()} / {data.requiredOjl.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${ojlPercent}%` }}
              />
            </div>
          </div>

          {/* RTI */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white text-sm font-medium">
                Related Technical (RTI)
              </span>
              <span className="text-slate-400 text-sm tabular-nums">
                {data.rtiHours.toLocaleString()} / {data.requiredRti.toLocaleString()}
              </span>
            </div>
            <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${rtiPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Log Hours', href: '/apprentice/hours/log', icon: Clock },
            { label: 'Log Service', href: '/apprentice/competencies/log', icon: Award },
            { label: 'Training', href: '/pwa/barber/onboarding', icon: BookOpen },
            { label: 'Progress', href: '/apprentice/competencies', icon: TrendingUp },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-slate-800 rounded-xl p-4 flex items-center gap-3 hover:bg-slate-700 transition"
            >
              <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-white text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Full portal link */}
        <Link
          href="/portal/apprentice"
          className="flex items-center justify-between bg-slate-800 rounded-xl p-4 hover:bg-slate-700 transition"
        >
          <div className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-amber-400 inline-block flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-white text-sm font-semibold">Full Apprentice Portal</p>
              <p className="text-slate-500 text-xs">Documents, handbook, state board & more</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </Link>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <button className="flex flex-col items-center gap-1 text-amber-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <Link href="/apprentice/timeclock" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Clock</span>
          </Link>
          <Link href="/pwa/barber/onboarding" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Training</span>
          </Link>
          <Link href="/apprentice/competencies" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
