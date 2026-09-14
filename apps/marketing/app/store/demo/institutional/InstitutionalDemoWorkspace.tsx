'use client';

import { useState } from 'react';
import { Award, BarChart3, CheckCircle2, FileBarChart, LayoutGrid, Users } from 'lucide-react';

const views = [
  {
    id: 'programs',
    label: 'Programs',
    icon: LayoutGrid,
    title: 'Program operations',
    description: 'Compare enrollment, attendance, and document readiness across sample programs.',
    rows: [
      ['Barber Apprenticeship', '28 participants', '94% attendance'],
      ['Cosmetology Apprenticeship', '17 participants', '91% attendance'],
      ['HVAC Technician', '22 participants', '88% attendance'],
    ],
  },
  {
    id: 'roster',
    label: 'Roster',
    icon: Users,
    title: 'Participant progress',
    description: 'Review sample learner status without exposing production participant records.',
    rows: [
      ['Sample Participant A', 'Orientation complete', 'On track'],
      ['Sample Participant B', 'Document review', 'Needs follow-up'],
      ['Sample Participant C', 'Training active', 'On track'],
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: FileBarChart,
    title: 'Compliance readiness',
    description: 'Filter the sample record set and see what requires staff attention.',
    rows: [
      ['Eligibility records', '64 complete', '3 need review'],
      ['Attendance records', '1,284 verified', '2 exceptions'],
      ['Supporting documents', '97% complete', '5 outstanding'],
    ],
  },
  {
    id: 'outcomes',
    label: 'Outcomes',
    icon: BarChart3,
    title: 'Program outcomes',
    description: 'Use clearly labeled sample metrics to explore reporting workflows.',
    rows: [
      ['Active enrollments', '67', 'Across 3 programs'],
      ['Credentials recorded', '19', 'Current sample period'],
      ['Employer connections', '14', 'Sample partner network'],
    ],
  },
  {
    id: 'credentials',
    label: 'Credentials',
    icon: Award,
    title: 'Credential records',
    description: 'See completion checks and verification status before issuance.',
    rows: [
      ['Sample Credential 1042', 'Requirements met', 'Ready'],
      ['Sample Credential 1043', 'Final check', 'Review'],
      ['Sample Credential 1044', 'Issued', 'Verified'],
    ],
  },
] as const;

export default function InstitutionalDemoWorkspace() {
  const [activeId, setActiveId] = useState<(typeof views)[number]['id']>('programs');
  const active = views.find((view) => view.id === activeId) ?? views[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-400" />
        <div className="h-3 w-3 rounded-full bg-yellow-400" />
        <div className="h-3 w-3 rounded-full bg-green-400" />
        <span className="ml-3 text-xs font-semibold text-slate-600">
          Interactive sample workspace
        </span>
      </div>

      <div className="grid md:grid-cols-[210px_1fr]">
        <nav
          className="border-b border-slate-200 bg-slate-950 p-3 md:border-b-0 md:border-r"
          aria-label="Demo workspace views"
        >
          {views.map((view) => {
            const Icon = view.icon;
            const selected = active.id === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => setActiveId(view.id)}
                aria-pressed={selected}
                className={`mb-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-bold ${selected ? 'bg-brand-red-600 text-white' : 'text-slate-200 hover:bg-slate-800'}`}
              >
                <Icon className="h-4 w-4" /> {view.label}
              </button>
            );
          })}
        </nav>

        <div className="min-h-[430px] bg-slate-50 p-5 sm:p-7" aria-live="polite">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-red-700">
            Demo data only
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{active.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{active.description}</p>
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {active.rows.map(([name, value, status]) => (
              <div
                key={name}
                className="grid gap-2 border-b border-slate-100 p-4 last:border-0 sm:grid-cols-[1.35fr_1fr_1fr] sm:items-center"
              >
                <p className="font-bold text-slate-950">{name}</p>
                <p className="text-sm text-slate-700">{value}</p>
                <p className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {status}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs font-medium text-slate-500">
            Select another workspace view to continue the guided demo. No action writes to
            production.
          </p>
        </div>
      </div>
    </div>
  );
}
