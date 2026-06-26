'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, User, FileText, Building2, BookOpen, Clock, Bell, CheckCircle, ChevronRight, Loader2 } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof ICON_MAP;
  completed: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const ICON_MAP = { user: User, file: FileText, building: Building2, book: BookOpen, clock: Clock, bell: Bell };

const DEFAULT_STEPS: OnboardingStep[] = [
  { id: 'account', title: 'Create Your Account', description: 'Set up your apprentice profile with your name, contact info, and photo.', icon: 'user', completed: false, actionUrl: '/learner/dashboard', actionLabel: 'Go to Profile' },
  { id: 'documents', title: 'Upload Your ID', description: 'Upload a government-issued photo ID to verify your identity.', icon: 'file', completed: false, actionUrl: '/programs/cosmetology-apprenticeship/documents', actionLabel: 'Upload Documents' },
  { id: 'salon', title: 'Confirm Your Host Salon', description: 'Your training salon must be approved before you can log hours.', icon: 'building', completed: false, actionUrl: '/pwa/cosmetology', actionLabel: 'View Status' },
  { id: 'orientation', title: 'Complete Orientation', description: 'Review program requirements, your rights, and what to expect.', icon: 'book', completed: false, actionUrl: '/programs/cosmetology-apprenticeship/orientation', actionLabel: 'Start Orientation' },
  { id: 'hours', title: 'Log Your First Hours', description: 'Once your salon is approved, start logging your weekly training hours.', icon: 'clock', completed: false, actionUrl: '/pwa/cosmetology/log-hours', actionLabel: 'Log Hours' },
  { id: 'notifications', title: 'Enable Notifications', description: 'Get reminders to log hours and updates on your application status.', icon: 'bell', completed: false, actionLabel: 'Enable' },
];

export default function CosmetologyOnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_STEPS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = '/login?redirect=/pwa/cosmetology/onboarding'; return; }

      // Mark account step complete if signed in
      setSteps(prev => prev.map(s => s.id === 'account' ? { ...s, completed: true } : s));

      // Check for uploaded documents
      const { data: docs } = await supabase
        .from('program_holder_documents')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);
      if (docs && docs.length > 0) {
        setSteps(prev => prev.map(s => s.id === 'documents' ? { ...s, completed: true } : s));
      }

      // Check orientation completion
      const { data: orientation } = await supabase
        .from('orientation_completions')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('program_slug', 'cosmetology-apprenticeship')
        .limit(1);
      if (orientation && orientation.length > 0) {
        setSteps(prev => prev.map(s => s.id === 'orientation' ? { ...s, completed: true } : s));
      }

      // Check hour logs
      const { data: hours } = await supabase
        .from('apprentice_hours')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);
      if (hours && hours.length > 0) {
        setSteps(prev => prev.map(s => s.id === 'hours' ? { ...s, completed: true } : s));
      }

      setLoading(false);
    };
    init();
  }, []);

  const completedCount = steps.filter(s => s.completed).length;
  const allDone = completedCount === steps.length;

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center"><Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" /><p className="text-white">Loading...</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      <header className="bg-purple-700 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/cosmetology" className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-white font-bold text-xl">Getting Started</h1>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-purple-200 text-sm">{completedCount} of {steps.length} steps complete</span>
            <span className="text-white font-bold">{Math.round((completedCount / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-purple-900 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all" style={{ width: `${(completedCount / steps.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {allDone && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-300 font-bold">You&apos;re all set!</p>
            <p className="text-green-400 text-sm mt-1">Your onboarding is complete. Start logging hours.</p>
          </div>
        )}

        <div className="space-y-3">
          {steps.map((step, i) => {
            const Icon = ICON_MAP[step.icon];
            const locked = !step.completed && i > 0 && !steps[i - 1].completed;
            return (
              <div key={step.id} className={`bg-slate-800 rounded-xl p-4 ${locked ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-green-500' : 'bg-slate-700'}`}>
                    {step.completed ? <CheckCircle className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${step.completed ? 'text-green-300 line-through' : 'text-white'}`}>{step.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{step.description}</p>
                    {!step.completed && !locked && step.actionUrl && (
                      <Link href={step.actionUrl} className="inline-flex items-center gap-1 mt-2 text-purple-400 text-sm font-medium hover:text-purple-300">
                        {step.actionLabel} <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                    {!step.completed && !locked && !step.actionUrl && step.actionLabel === 'Enable' && (
                      <button
                        onClick={() => { Notification.requestPermission().then(p => { if (p === 'granted') setSteps(prev => prev.map(s => s.id === 'notifications' ? { ...s, completed: true } : s)); }); }}
                        className="inline-flex items-center gap-1 mt-2 text-purple-400 text-sm font-medium hover:text-purple-300"
                      >
                        Enable Notifications <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
