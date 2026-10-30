'use client';
import Link from 'next/link';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

type RecordRow = {
  competency_id: string;
  completed: boolean;
  date_completed: string | null;
  verified_by_name: string | null;
  notes: string | null;
  requires_practical_evidence?: boolean;
  performance_subject?: 'student' | 'patron' | 'mannequin' | null;
  evidence_type?: string | null;
  evidence_url?: string | null;
  practical_performed_at?: string | null;
  evidence_review_status?: string | null;
  verified_by_license_number?: string | null;
};

type Competency = {
  id: string;
  sourceLabel?: string;
  category: string;
  description: string;
};

type Standard = {
  occupationTitle: string;
  onetSocCode: string;
  rapidsCode: string;
  competencyCount: number;
  relatedInstructionHours: number;
  probationaryHours: number;
  startingHourlyRate: number;
  mentorHourlyRate: number;
  wageMilestones: Array<{ completedCompetencies: number; hourlyRate: number }>;
  competencies: Competency[];
};

type Apprentice = {
  enrollmentId: string;
  studentId: string;
  programSlug: string;
  name: string;
  email: string;
  practiceOnly?: boolean;
  placementId?: string;
  standard: Standard;
  completedCompetencies: number;
  competencyRecords: RecordRow[];
};

function initials(name: string | null | undefined) {
  return (name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function CompetencyManager() {
  const [apprentices, setApprentices] = useState<Apprentice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/host-shop/competencies', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to load competency records');
      setApprentices(body.apprentices || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load competency records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPending = useMemo(
    () =>
      apprentices.reduce(
        (sum, apprentice) =>
          sum +
          (apprentice.practiceOnly
            ? 0
            : apprentice.standard.competencyCount - apprentice.completedCompetencies),
        0,
      ),
    [apprentices],
  );

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
          Supervisor workflow
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-slate-950">
          Record hands-on practice for your assigned apprentices
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <b>1. Observe the service</b>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Watch the apprentice perform the work safely and to the standard shown below.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <b>2. Capture evidence</b>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Practical skills require the performance subject, dated evidence, and verifier license
              information when applicable.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <b>3. Check off the skill</b>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Record each supervised practical service. Elevate and the registered sponsor handle
              formal Appendix A competency approvals.
            </p>
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-700">
            DOL Appendix A
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Practical Training Progress</h1>
          <p className="mt-1 text-sm text-slate-600">
            Record supervised services. Formal Appendix A competency sign-offs are handled by the
            sponsor, not Host Shops.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active apprentices</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{apprentices.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Competencies remaining</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {apprentices.some((apprentice) => apprentice.practiceOnly)
              ? 'Sponsor setup required'
              : totalPending}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Verification model</p>
          <p className="mt-1 text-sm font-bold text-slate-900">Date completed + mentor identity</p>
        </div>
      </div>

      {apprentices.length > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-white p-5">
          <h2 className="text-xl font-black">Apprentice training progress chart</h2>
          <p className="mt-1 text-sm text-slate-600">
            Shows verified competency progress where a registered standard is available.
            Practice-only placements remain visible without fabricated approvals.
          </p>
          <div className="mt-4 space-y-5">
            {apprentices.map((apprentice) => {
              const total = apprentice.standard.competencyCount;
              const completed = apprentice.completedCompetencies;
              const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
              return (
                <div key={apprentice.enrollmentId}>
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-bold">
                      {apprentice.name} · {apprentice.standard.occupationTitle}
                    </span>
                    <span>
                      {apprentice.practiceOnly
                        ? 'Practical services: record below'
                        : completed + ' of ' + total + ' competencies verified'}
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-label={apprentice.name + ' competency progress'}
                    className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200"
                  >
                    <div
                      className="h-full rounded-full bg-blue-700"
                      style={{ width: percent + '%' }}
                    />
                  </div>
                  {apprentice.practiceOnly && (
                    <p className="mt-2 text-xs text-amber-800">
                      Registered competency standard awaiting sponsor linkage. Logged practical
                      services do not certify completion.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      {apprentices.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 font-semibold text-slate-900">
            No active Appendix A apprentices assigned
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            An active placement and program enrollment are required to display training progress.
          </p>
        </div>
      ) : null}

      {apprentices.map((apprentice) => {
        const recordById = new Map(
          apprentice.competencyRecords.map((row) => [row.competency_id, row]),
        );
        const completed = apprentice.competencyRecords.filter((row) => row.completed).length;
        const pct = apprentice.standard.competencyCount
          ? Math.round((completed / apprentice.standard.competencyCount) * 100)
          : 0;
        const nextWage = apprentice.standard.wageMilestones.find(
          (milestone) => milestone.completedCompetencies > completed,
        );

        return (
          <section
            key={apprentice.enrollmentId}
            className="overflow-hidden rounded-2xl border bg-white"
          >
            <div className="border-b bg-slate-50 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{apprentice.name}</h2>
                  <p className="text-sm text-slate-500">
                    {apprentice.standard.occupationTitle}
                    {apprentice.practiceOnly
                      ? ' · Sponsor standard linkage pending'
                      : ` · RAPIDS ${apprentice.standard.rapidsCode} · O*NET-SOC ${apprentice.standard.onetSocCode}`}
                  </p>
                </div>
                {!apprentice.practiceOnly && (
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {completed}/{apprentice.standard.competencyCount} competencies
                    </p>
                    <p className="text-xs text-slate-500">
                      {apprentice.standard.relatedInstructionHours} RTI hours required
                    </p>
                  </div>
                )}
              </div>
              {!apprentice.practiceOnly && (
                <>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-blue-600"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                    <span>Competency progress: {pct}%</span>
                    <span>Probationary period: {apprentice.standard.probationaryHours} hrs</span>
                    <span>Mentor ratio: 1:1</span>
                    {nextWage ? (
                      <span>
                        Next wage step at {nextWage.completedCompetencies} competencies: $
                        {nextWage.hourlyRate.toFixed(2)}/hr
                      </span>
                    ) : (
                      <span>Final Appendix A wage step reached</span>
                    )}
                  </div>
                </>
              )}
            </div>

            {apprentice.practiceOnly && (
              <div className="border-t p-5">
                <h3 className="font-black">Record supervised salon service</h3>
                <p className="mt-1 text-sm">
                  Choose a service, date, and person served. These are training observations, not
                  formal competency sign-offs.
                </p>
                <Link
                  href="/host-shop/dashboard/practical-log"
                  className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 py-2 font-bold text-white"
                >
                  Open Practical Service Log
                </Link>
              </div>
            )}
            <div className="divide-y">
              {apprentice.standard.competencies.map((competency, index) => {
                const record = recordById.get(competency.id);
                const isComplete = Boolean(record?.completed);
                const key = `${apprentice.enrollmentId}:${competency.id}`;
                return (
                  <div
                    key={competency.id}
                    className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-6"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {competency.sourceLabel || index + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {competency.category}
                          </p>
                          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">
                            {competency.description}
                          </p>
                          {isComplete ? (
                            <p className="mt-2 text-xs text-brand-green-700">
                              Completed {record?.date_completed || ''} ·{' '}
                              {record?.performance_subject
                                ? `Performed on ${record.performance_subject} · `
                                : ''}
                              Initials {initials(record?.verified_by_name)} · Verified by{' '}
                              {record?.verified_by_name || 'mentor'}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/host-shop/dashboard/practical-log"
                        className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-900"
                      >
                        Open Practical Service Log
                      </Link>
                      <span className="text-xs font-semibold text-slate-600">
                        {isComplete ? 'Sponsor verified' : 'Sponsor review pending'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
