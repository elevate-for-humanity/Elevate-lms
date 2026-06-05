'use client';

import { Calendar, Clock, Award, Briefcase, DollarSign, Landmark } from 'lucide-react';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import { buildProgramAtAGlance } from '@/lib/programs/program-at-a-glance';

const ICONS = [Calendar, Clock, Award, Briefcase, DollarSign, Landmark] as const;

export default function ProgramAtAGlance({ program }: { program: ProgramSchema }) {
  const rows = buildProgramAtAGlance(program);

  return (
    <section
      className="py-10 bg-brand-blue-50 border-y border-brand-blue-100"
      aria-labelledby="program-at-a-glance-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2
          id="program-at-a-glance-heading"
          className="text-lg font-extrabold text-slate-900 mb-1"
        >
          Program at a Glance
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          Answers workforce boards and applicants need before applying.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row, i) => {
            const Icon = ICONS[i] ?? Award;
            return (
              <div
                key={row.question}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-brand-red-600 flex-shrink-0" aria-hidden />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {row.question}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900 leading-snug">{row.answer}</p>
                {row.detail ? (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{row.detail}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
