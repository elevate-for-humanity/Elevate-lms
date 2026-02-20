'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { 
  ArrowLeft, Circle, ChevronRight, 
  User, FileText, Building2, BookOpen, Clock,
  Award, Bell, Loader2, Sparkles, Scissors, TrendingUp
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: 'user' | 'file' | 'building' | 'book' | 'clock' | 'bell';
  completed: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const ICON_MAP = {
  user: User,
  file: FileText,
  building: Building2,
  book: BookOpen,
  clock: Clock,
  bell: Bell,
};

export default function OnboardingPage() {
  const [dbRows, setDbRows] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from('system_settings').select('*').limit(50)
      .then(({ data }) => { if (data) setDbRows(data); });
  }, []);

  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSteps([
        {
          id: '1',
          title: 'Complete Your Profile',
          description: 'Add your contact information and photo',
          icon: 'user',
          completed: true,
          actionUrl: '/pwa/barber/profile',
          actionLabel: 'Edit Profile',
        },
        {
          id: '2',
          title: 'Review Program Requirements',
          description: 'Understand the 2,000 hour requirement and categories',
          icon: 'file',
          completed: true,
          actionUrl: '/pwa/barber/training',
          actionLabel: 'View Requirements',
        },
        {
          id: '3',
          title: 'Connect with Your Shop',
          description: 'Verify your training location assignment',
          icon: 'building',
          completed: true,
        },
        {
          id: '4',
          title: 'Start Training Modules',
          description: 'Begin the Milady curriculum',
          icon: 'book',
          completed: false,
          actionUrl: '/pwa/barber/training',
          actionLabel: 'Start Learning',
        },
        {
          id: '5',
          title: 'Log Your First Hours',
          description: 'Record your first training session',
          icon: 'clock',
          completed: false,
          actionUrl: '/pwa/barber/hours/submit',
          actionLabel: 'Log Hours',
        },
        {
          id: '6',
          title: 'Enable Notifications',
          description: 'Stay updated on approvals and milestones',
          icon: 'bell',
          completed: false,
          actionUrl: '/pwa/barber/settings',
          actionLabel: 'Enable',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-blue-500 animate-spin" />
      </div>
    );
  }

  const allComplete = completedCount === steps.length;

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      <header className="bg-brand-blue-600 px-4 pt-12 pb-6 safe-area-inset-top">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/pwa/barber" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Getting Started</h1>
            <p className="text-brand-blue-200 text-sm">Complete your onboarding</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-brand-blue-200 text-sm">Onboarding Progress</span>
            <span className="text-white font-bold">{completedCount}/{steps.length}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-4">
        {allComplete ? (
          <div className="bg-brand-green-500/20 border border-brand-green-500/30 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-brand-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You're All Set!</h2>
            <p className="text-brand-green-200 mb-4">
              You've completed all onboarding steps. You're ready to start your apprenticeship journey!
            </p>
            <Link 
              href="/pwa/barber"
              className="inline-block bg-brand-green-500 text-white font-bold px-6 py-3 rounded-xl"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Next Step Highlight */}
            {(() => {
              const nextStep = steps.find(s => !s.completed);
              if (!nextStep) return null;
              const Icon = ICON_MAP[nextStep.icon];
              
              return (
                <div className="bg-brand-blue-500/20 border border-brand-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-brand-blue-400" />
                    <span className="text-brand-blue-300 text-sm font-medium">Next Step</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-blue-500 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold">{nextStep.title}</h3>
                      <p className="text-brand-blue-200 text-sm">{nextStep.description}</p>
                    </div>
                  </div>
                  {nextStep.actionUrl && (
                    <Link 
                      href={nextStep.actionUrl}
                      className="mt-4 flex items-center justify-center gap-2 bg-brand-blue-500 text-white font-medium py-3 rounded-xl"
                    >
                      {nextStep.actionLabel || 'Continue'}
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  )}
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-brand-green-500' : 'bg-slate-700'
                      }`}>
                        {step.completed ? (
                          <span className="text-slate-400 flex-shrink-0">•</span>
                        ) : (
                          <span className="text-slate-400 font-medium">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${step.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                          {step.title}
                        </h3>
                        <p className="text-slate-500 text-sm">{step.description}</p>
                      </div>
                      {!step.completed && step.actionUrl && (
                        <Link href={step.actionUrl}>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="bg-slate-800 rounded-xl p-4 mt-6">
          <h3 className="text-white font-medium mb-2">Need Help?</h3>
          <p className="text-slate-400 text-sm mb-3">
            Contact your supervisor or program coordinator if you have questions about your apprenticeship.
          </p>
          <Link 
            href="/help"
            className="text-brand-blue-400 text-sm font-medium"
          >
            Visit Help Center →
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-6 py-3 safe-area-inset-bottom">
        <div className="flex justify-around">
          <Link href="/pwa/barber" className="flex flex-col items-center gap-1 text-slate-400">
            <Scissors className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/pwa/barber/log-hours" className="flex flex-col items-center gap-1 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="text-xs">Log</span>
          </Link>
          <Link href="/pwa/barber/training" className="flex flex-col items-center gap-1 text-slate-400">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Learn</span>
          </Link>
          <Link href="/pwa/barber/progress" className="flex flex-col items-center gap-1 text-slate-400">
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs">Progress</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
