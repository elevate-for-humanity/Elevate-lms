'use client';

/**
 * Renders the exam list for a provider detail page with cart integration.
 * Replaces the static "Pay for Test" link with AddExamToCartButton.
 */

import { Clock, Users, CreditCard } from 'lucide-react';
import type { ExamDefinition } from '@/lib/testing/proctoring-capabilities';
import { AddExamToCartButton } from './TestingCart';
import { getProvidersForAmount } from '@/lib/bnpl-config';

interface ProviderExamListProps {
  providerKey: string;
  exams: (string | ExamDefinition)[];
  isActive: boolean;
}

export function ProviderExamList({ providerKey, exams, isActive }: ProviderExamListProps) {
  return (
    <div className="space-y-4">
      {exams.map((exam) => {
        const isObj = typeof exam === 'object';
        const name = isObj ? (exam as ExamDefinition).name : (exam as string);
        const desc = isObj ? (exam as ExamDefinition).description : undefined;
        const duration = isObj ? (exam as ExamDefinition).durationMinutes : undefined;
        const questions = isObj ? (exam as ExamDefinition).questionCount : undefined;
        const ncrc = isObj ? (exam as ExamDefinition).ncrcLevel : undefined;
        const amountCents = isObj ? (exam as ExamDefinition).amountCents : undefined;

        // Check for BNPL eligibility
        const bnplProviders = amountCents ? getProvidersForAmount(amountCents / 100) : [];

        return (
          <div key={name} className="bg-slate-50 rounded-xl border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 text-base leading-snug">{name}</h3>
                {bnplProviders.length > 0 && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                    BNPL Available: {bnplProviders.map(p => p.name).join(' · ')}
                  </p>
                )}
              </div>
              {isActive && amountCents ? (
                <AddExamToCartButton
                  examType={providerKey}
                  examName={name}
                  amountCents={amountCents}
                  active={isActive}
                />
              ) : isActive ? (
                // Fallback for exams without a per-exam price (shouldn't happen after migration)
                <a
                  href={`/testing/book?exam=${providerKey}&exam_name=${encodeURIComponent(name)}`}
                  className="inline-flex items-center gap-1 border border-brand-red-300 text-brand-red-700 hover:border-brand-red-400 text-xs font-semibold px-2.5 py-1 rounded-md whitespace-nowrap"
                >
                  Pay for Test
                </a>
              ) : null}
            </div>
            {desc && <p className="text-slate-700 text-sm leading-relaxed">{desc}</p>}
            {(duration || questions || ncrc) && (
              <div className="mt-3 flex flex-wrap gap-3">
                {duration && (
                  <span className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
                    ⏱{' '}
                    {duration >= 60
                      ? `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}`
                      : `${duration} min`}
                  </span>
                )}
                {questions && (
                  <span className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
                    {questions} question{questions !== 1 ? 's' : ''}
                  </span>
                )}
                {ncrc && (
                  <span className="text-xs bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full">
                    {ncrc}
                  </span>
                )}
                {amountCents && (
                  <span className="text-xs bg-brand-blue-50 border border-brand-blue-100 text-brand-blue-700 font-semibold px-2.5 py-1 rounded-full">
                    ${(amountCents / 100).toFixed(0)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
