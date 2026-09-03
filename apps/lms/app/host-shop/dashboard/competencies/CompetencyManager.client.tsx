'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

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
  const [savingKey, setSavingKey] = useState<string | null>(null);
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
    () => apprentices.reduce((sum, apprentice) => sum + (apprentice.standard.competencyCount - apprentice.completedCompetencies), 0),
    [apprentices],
  );

  async function setCompetency(apprentice: Apprentice, competency: Competency, completed: boolean) {
    let evidence: Record<string, string> = {};
    if (completed && /(trim|cut|shav|apply|clean|steriliz|disinfect|massage|wax|extraction|tint|manicur|pedicur|nail|skin|hair|protective covering|tool|equipment)/i.test(`${competency.category} ${competency.description}`)) {
      const performanceSubject = window.prompt('Who was the practical performed on? Enter student, patron, or mannequin.');
      if (!performanceSubject || !['student', 'patron', 'mannequin'].includes(performanceSubject.toLowerCase())) {
        setError('Practical sign-off cancelled: select student, patron, or mannequin.');
        return;
      }
      const evidenceUrl = window.prompt('Paste the photo, video, checklist, or observation evidence URL.');
      if (!evidenceUrl?.trim()) {
        setError('Practical sign-off cancelled: evidence is required.');
        return;
      }
      const instructorLicenseNumber = window.prompt('Enter your current Indiana instructor or professional license number.');
      if (!instructorLicenseNumber?.trim()) {
        setError('Practical sign-off cancelled: verifier license number is required.');
        return;
      }
      evidence = {
        performanceSubject: performanceSubject.toLowerCase(),
        evidenceType: 'observation',
        evidenceUrl: evidenceUrl.trim(),
        performedAt: new Date().toISOString().slice(0, 10),
        instructorLicenseNumber: instructorLicenseNumber.trim(),
      };
    }
    const key = `${apprentice.enrollmentId}:${competency.id}`;
    setSavingKey(key);
    setError(null);
    try {
      const response = await fetch('/api/host-shop/competencies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: apprentice.enrollmentId,
          competencyId: competency.id,
          completed,
          ...evidence,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to save competency');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Unable to save competency');
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-blue-700">DOL Appendix A</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Competency Sign-Offs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Check off only competencies you personally observed. Indiana practical services also require the performance subject, dated evidence, and your current license number before approval.
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
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active apprentices</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{apprentices.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Competencies remaining</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalPending}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Verification model</p>
          <p className="mt-1 text-sm font-bold text-slate-900">Date completed + mentor identity</p>
        </div>
      </div>

      {apprentices.length === 0 ? (
        <div className="rounded-2xl border bg-white px-6 py-12 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 font-semibold text-slate-900">No active Appendix A apprentices assigned</h2>
          <p className="mt-1 text-sm text-slate-500">An active placement and program enrollment are required before a mentor can sign competencies.</p>
        </div>
      ) : null}

      {apprentices.map((apprentice) => {
        const recordById = new Map(apprentice.competencyRecords.map((row) => [row.competency_id, row]));
        const completed = apprentice.competencyRecords.filter((row) => row.completed).length;
        const pct = Math.round((completed / apprentice.standard.competencyCount) * 100);
        const nextWage = apprentice.standard.wageMilestones.find((milestone) => milestone.completedCompetencies > completed);

        return (
          <section key={apprentice.enrollmentId} className="overflow-hidden rounded-2xl border bg-white">
            <div className="border-b bg-slate-50 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{apprentice.name}</h2>
                  <p className="text-sm text-slate-500">{apprentice.standard.occupationTitle} · RAPIDS {apprentice.standard.rapidsCode} · O*NET-SOC {apprentice.standard.onetSocCode}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-slate-900">{completed}/{apprentice.standard.competencyCount} competencies</p>
                  <p className="text-xs text-slate-500">{apprentice.standard.relatedInstructionHours} RTI hours required</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-blue-600" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                <span>Competency progress: {pct}%</span>
                <span>Probationary period: {apprentice.standard.probationaryHours} hrs</span>
                <span>Mentor ratio: 1:1</span>
                {nextWage ? <span>Next wage step at {nextWage.completedCompetencies} competencies: ${nextWage.hourlyRate.toFixed(2)}/hr</span> : <span>Final Appendix A wage step reached</span>}
              </div>
            </div>

            <div className="divide-y">
              {apprentice.standard.competencies.map((competency, index) => {
                const record = recordById.get(competency.id);
                const isComplete = Boolean(record?.completed);
                const key = `${apprentice.enrollmentId}:${competency.id}`;
                return (
                  <div key={competency.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto] sm:px-6">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {competency.sourceLabel || index + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{competency.category}</p>
                          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-900">{competency.description}</p>
                          {isComplete ? (
                            <p className="mt-2 text-xs text-brand-green-700">
                              Completed {record?.date_completed || ''} · {record?.performance_subject ? `Performed on ${record.performance_subject} · ` : ''}Initials {initials(record?.verified_by_name)} · Verified by {record?.verified_by_name || 'mentor'}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={savingKey === key}
                      onClick={() => void setCompetency(apprentice, competency, !isComplete)}
                      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                        isComplete
                          ? 'border border-brand-green-300 bg-brand-green-50 text-brand-green-800 hover:bg-brand-green-100'
                          : 'border border-slate-300 bg-white text-slate-700 hover:border-brand-blue-300 hover:bg-brand-blue-50'
                      }`}
                    >
                      {savingKey === key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      {isComplete ? 'Verified' : 'Check off'}
                    </button>
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
