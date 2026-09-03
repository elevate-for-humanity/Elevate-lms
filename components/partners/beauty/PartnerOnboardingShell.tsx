/**
 * PartnerOnboardingShell
 *
 * Shared onboarding layout for esthetician and nail technician apprenticeship
 * partner shops. Renders the step nav, progress indicator, and step content.
 *
 * Used by:
 *   app/partners/esthetician-apprenticeship/(onboarding)/*/page.tsx
 *   app/partners/nail-technician-apprenticeship/(onboarding)/*/page.tsx
 */

import Link from 'next/link';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';

export type OnboardingStep = {
  id: string;
  label: string;
  href: string;
  completed?: boolean;
};

type Props = {
  program: 'esthetician' | 'nail';
  currentStep: string;
  steps: OnboardingStep[];
  children: React.ReactNode;
};

const PROGRAM_META = {
  esthetician: {
    label: 'Esthetician Apprenticeship',
    color: 'pink',
    baseHref: '/partners/esthetician-apprenticeship',
  },
  nail: {
    label: 'Nail Technician Apprenticeship',
    color: 'purple',
    baseHref: '/partners/nail-technician-apprenticeship',
  },
} as const;

export function PartnerOnboardingShell({ program, currentStep, steps, children }: Props) {
  const meta = PROGRAM_META[program];
  const accent = meta.color === 'pink' ? 'text-pink-600 bg-pink-600' : 'text-purple-600 bg-purple-600';
  const accentBorder = meta.color === 'pink' ? 'border-pink-200 bg-pink-50' : 'border-purple-200 bg-purple-50';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Partner Onboarding</p>
            <p className="font-bold text-slate-900 text-sm">{meta.label}</p>
          </div>
          <Link href={meta.baseHref} className="text-xs text-slate-500 hover:text-slate-700">
            ← Back to program
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-4 gap-8">
        {/* Step nav sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Steps</p>
            <nav className="space-y-1">
              {steps.map((step, i) => {
                const isCurrent = step.id === currentStep;
                const isDone = step.completed;
                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isCurrent
                        ? `${accentBorder} border font-semibold`
                        : isDone
                        ? 'text-slate-600 hover:bg-slate-50'
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-4 h-4 text-brand-green-500 shrink-0" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent ? `border-current ${accent.split(' ')[0]}` : 'border-slate-300 text-slate-400'
                      }`}>
                        {i + 1}
                      </span>
                    )}
                    <span className="leading-tight">{step.label}</span>
                    {isCurrent && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
