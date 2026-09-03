'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, ShieldCheck } from 'lucide-react';

type Competency = { id: string; sourceLabel?: string; category: string; description: string };
type RecordRow = { competency_id: string; completed: boolean; date_completed: string | null; verified_by_name: string | null; notes: string | null; requires_practical_evidence?: boolean; performance_subject?: 'student' | 'patron' | 'mannequin' | null; evidence_url?: string | null; evidence_review_status?: string | null; verified_by_license_number?: string | null; state_standard_version?: string | null };
type Standard = {
  occupationTitle: string; onetSocCode: string; rapidsCode: string; competencyCount: number; relatedInstructionHours: number;
  probationaryHours: number; startingHourlyRate: number; mentorHourlyRate: number;
  wageMilestones: Array<{ completedCompetencies: number; hourlyRate: number }>;
  competencies: Competency[]; relatedInstruction: Array<{ title: string; hours: number }>;
};
type RtiProvider = { id: string; providerName: string; status: string };

function initials(name: string | null | undefined) { return (name || '').split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]?.toUpperCase()).join(''); }

export default function AppendixAProgress() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standard, setStandard] = useState<Standard | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [rtiProviders, setRtiProviders] = useState<RtiProvider[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/apprentice/appendix-a-progress', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to load progress');
        if (!active) return;
        setStandard(body.standard || null);
        setRecords(body.records || []);
        setRtiProviders(body.rtiProviders || []);
      })
      .catch((err) => active && setError(err?.message || 'Unable to load progress'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const completed = useMemo(() => records.filter((row) => row.completed).length, [records]);
  if (loading) return <div className="flex min-h-[320px] items-center justify-center rounded-2xl border bg-white"><Loader2 className="h-6 w-6 animate-spin text-brand-blue-600" /></div>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  if (!standard) return <div className="rounded-2xl border bg-white px-6 py-12 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-3 text-xl font-bold text-slate-900">No active registered apprenticeship found</h1><p className="mt-2 text-sm text-slate-500">Your active program enrollment must be linked to a registered occupation before competency progress can be displayed.</p></div>;

  const recordById = new Map(records.map((record) => [record.competency_id, record]));
  const pct = Math.round((completed / standard.competencyCount) * 100);
  const nextWage = standard.wageMilestones.find((milestone) => milestone.completedCompetencies > completed);

  return <div className="space-y-6">
    <section className="rounded-2xl border bg-white p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-wider text-brand-blue-700">U.S. DOL Registered Program</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{standard.occupationTitle} Competency Progress</h1><p className="mt-1 text-sm text-slate-600">RAPIDS {standard.rapidsCode} · O*NET-SOC {standard.onetSocCode} · Competency-based apprenticeship</p><div className="mt-5 grid gap-4 sm:grid-cols-4"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Verified competencies</p><p className="mt-1 text-2xl font-bold">{completed}/{standard.competencyCount}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">RTI requirement</p><p className="mt-1 text-2xl font-bold">{standard.relatedInstructionHours} hrs</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Probationary period</p><p className="mt-1 text-2xl font-bold">{standard.probationaryHours} hrs</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">Next baseline wage step</p><p className="mt-1 text-lg font-bold">{nextWage ? `${nextWage.completedCompetencies} comps → $${nextWage.hourlyRate.toFixed(2)}/hr` : 'Final baseline step reached'}</p></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-600" style={{ width: `${Math.min(100, pct)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{pct}% of registered competencies verified by your assigned mentor/host shop.</p></section>

    <section className="overflow-hidden rounded-2xl border bg-white"><div className="border-b px-5 py-4 sm:px-6"><h2 className="font-bold text-slate-900">Work Process Schedule</h2><p className="mt-1 text-sm text-slate-500">Your Host Shop or authorized program staff records the completion date and verifier for each competency.</p></div><div className="divide-y">{standard.competencies.map((competency, index) => { const record = recordById.get(competency.id); const isComplete = Boolean(record?.completed); return <div key={competency.id} className="flex gap-3 px-5 py-4 sm:px-6">{isComplete ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand-green-600" /> : <Circle className="mt-0.5 h-5 w-5 flex-none text-slate-300" />}<div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{competency.sourceLabel || index + 1} · {competency.category}</p><p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">{competency.description}</p>{isComplete ? <p className="mt-2 text-xs text-brand-green-700">Completed {record?.date_completed || ''} · {record?.performance_subject ? `Performed on ${record.performance_subject} · ` : ''}Initials {initials(record?.verified_by_name)} · Verified by {record?.verified_by_name || 'authorized mentor'}</p> : <p className="mt-2 text-xs text-slate-400">Awaiting mentor verification{record?.requires_practical_evidence ? ' and Indiana practical evidence' : ''}</p>}</div></div>; })}</div></section>

    <section className="rounded-2xl border bg-white p-5 sm:p-6"><h2 className="font-bold text-slate-900">Related Instruction Outline</h2><p className="mt-1 text-sm text-slate-500">Authorized RTI providers: {rtiProviders.length ? rtiProviders.map((provider) => provider.providerName).join(', ') : 'No active provider record is currently published to this enrollment.'}</p><div className="mt-4 divide-y rounded-xl border">{standard.relatedInstruction.map((item) => <div key={item.title} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-slate-800">{item.title}</span><span className="font-semibold text-slate-900">{item.hours} hrs</span></div>)}<div className="flex items-center justify-between gap-4 bg-slate-50 px-4 py-3 text-sm font-bold"><span>Total minimum RTI</span><span>{standard.relatedInstructionHours} hrs</span></div></div></section>
  </div>;
}
