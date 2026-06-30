'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  ArrowLeft,
  ChevronRight,
  User,
  FileText,
  Building2,
  BookOpen,
  Clock,
  Bell,
  Loader2,
  Sparkles,
  Scissors,
  TrendingUp,
} from 'lucide-react';

// Maps UI step ids to the boolean column in onboarding_progress
const STEP_COLUMN_MAP = {
  profile: 'profile_completed',
  agreements: 'agreements_completed',
  handbook: 'handbook_acknowledged',
  documents: 'documents_uploaded',
} as const;

type StepId = keyof typeof STEP_COLUMN_MAP;

const STEP_DEFINITIONS: {
  id: StepId;
  title: string;
  description: string;
  icon: keyof typeof ICON_MAP;
  actionUrl: string;
  actionLabel: string;
}[] = [
  {
    id: 'profile',
    title: 'Complete Your Profile',
    description: 'Add your contact information and photo',
    icon: 'user',
    actionUrl: '/pwa/barber/profile',
    actionLabel: 'Edit Profile',
  },
  {
    id: 'agreements',
    title: 'Sign Program Agreements',
    description: 'Review and sign your apprenticeship agreements',
    icon: 'file',
    actionUrl: '/pwa/barber/profile',
    actionLabel: 'Sign Agreements',
  },
  {
    id: 'handbook',
    title: 'Acknowledge Handbook',
    description: 'Read and acknowledge the apprenticeship handbook',
    icon: 'book',
    actionUrl: '/pwa/barber',
    actionLabel: 'View Handbook',
  },
  {
    id: 'documents',
    title: 'Upload Your Documents',
    description: 'Submit required identification and training documents',
    icon: 'building',
    actionUrl: '/pwa/barber/profile',
    actionLabel: 'Upload Docs',
  },
];

const ICON_MAP = {
  user: User,
  file: FileText,
  building: Building2,
  book: BookOpen,
  clock: Clock,
  bell: Bell,
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<StepId | null>(null);
  const [completedSteps, setCompleted] = useState<Set<StepId>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const loadProgress = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.replace('/login?redirect=/pwa/barber/onboarding');
      return;
    }

    setUserId(session.user.id);

    const { data } = await supabase
      .from('onboarding_progress')
      .select('profile_completed, agreements_completed, handbook_acknowledged, documents_uploaded')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (data) {
      const done = new Set<StepId>();
      (Object.entries(STEP_COLUMN_MAP) as [StepId, string][]).forEach(([stepId, col]) => {
        if ((data as Record<string, unknown>)[col]) done.add(stepId);
      });
      setCompleted(done);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const markComplete = async (stepId: StepId) => {
    if (!userId || completedSteps.has(stepId)) return;
    setSaving(stepId);
    const col = STEP_COLUMN_MAP[stepId];
    const allDone = STEP_DEFINITIONS.every((s) => s.id === stepId || completedSteps.has(s.id));

    const { error } = await supabase.from('onboarding_progress').upsert(
      {
        user_id: userId,
        [col]: true,
        ...(allDone
          ? {
              is_complete: true,
              completed_at: new Date().toISOString(),
              status: 'complete',
              step: 'done',
            }
          : {}),
      },
      { onConflict: 'user_id' },
    );

    if (!error) {
      const next = new Set([...completedSteps, stepId]);
      setCompleted(next);
      // If all steps now done, mark profile.onboarding_completed
      if (STEP_DEFINITIONS.every((s) => next.has(s.id))) {
        await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
      }
    }
    setSaving(null);
  };

  const steps = STEP_DEFINITIONS.map((s) => ({ ...s, completed: completedSteps.has(s.id) }));
  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
  const allComplete = completedCount === steps.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-brand-blue-600 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/pwa/barber"
            className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Getting Started</h1>
            <p className="text-blue-200 text-sm">Complete your onboarding</p>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-200 text-sm">Onboarding Progress</span>
            <span className="text-white font-bold">
              {completedCount}/{steps.length}
            </span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        {allComplete ? (
          <div className="bg-slate-700 border border-emerald-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You're All Set!</h2>
            <p className="text-emerald-300 mb-4">
              You've completed all onboarding steps. You're ready to start your apprenticeship
              journey!
            </p>
            <Link
              href="/pwa/barber"
              className="inline-block bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Next Step Highlight */}
            {(() => {
              const next = steps.find((s) => !s.completed);
              if (!next) return null;
              const Icon = ICON_MAP[next.icon];
              return (
                <div className="bg-slate-700 border border-brand-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-brand-blue-400" />
                    <span className="text-brand-blue-300 text-sm font-medium">Next Step</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold">{next.title}</h3>
                      <p className="text-blue-200 text-sm">{next.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {next.actionUrl && (
                      <Link
                        href={next.actionUrl}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-blue-500 text-white font-medium py-3 rounded-xl"
                      >
                        {next.actionLabel || 'Continue'}
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    )}
                    <button
                      onClick={() => markComplete(next.id)}
                      disabled={saving === next.id}
                      className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium text-sm disabled:opacity-50"
                    >
                      {saving === next.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Mark Done'
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* All Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => {
                const Icon = ICON_MAP[step.icon];
                return (
                  <div
                    key={step.id}
                    className={`bg-slate-800 rounded-xl p-4 ${step.completed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-emerald-500' : 'bg-slate-700'}`}
                      >
                        {step.completed ? (
                          <span className="w-5 h-5 rounded-full bg-white inline-block flex-shrink-0" aria-hidden="true" />
                        ) : (
                          <span className="text-slate-400 font-medium text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-medium ${step.completed ? 'text-slate-400 line-through' : 'text-white'}`}
                        >
                          {step.title}
                        </h3>
                        <p className="text-slate-500 text-sm">{step.description}</p>
                      </div>
                      {!step.completed && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {step.actionUrl && (
                            <Link href={step.actionUrl}>
                              <ChevronRight className="w-5 h-5 text-slate-500" />
                            </Link>
                          )}
                          <button
                            onClick={() => markComplete(step.id)}
                            disabled={saving === step.id}
                            className="text-xs text-emerald-400 font-medium disabled:opacity-50"
                          >
                            {saving === step.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Done'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="bg-slate-800 rounded-xl p-4 mt-6">
          <h3 className="text-white font-medium mb-2">Need Help?</h3>
          <p className="text-slate-500 text-sm mb-3">
            Contact your supervisor or program coordinator if you have questions about your
            apprenticeship.
          </p>
          <Link href="/help" className="text-brand-blue-400 text-sm font-medium">
            Visit Help Center →
          </Link>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/pwa/barber"
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link
            href="/pwa/barber"
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link
            href="/pwa/barber"
            className="flex flex-col items-center gap-1 text-slate-400"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
