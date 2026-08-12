'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import CourseOperationsPanel from './CourseOperationsPanel';

type Program = { id: string; title: string };
type Course = {
  id: string;
  title: string;
  slug?: string;
  description?: string | null;
  program_id?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  published_at?: string | null;
  version?: number | null;
  review_status?: string | null;
  duration_hours?: number | null;
  passing_score?: number | null;
  compliance_profile_key?: string | null;
  governing_body?: string | null;
  governing_region?: string | null;
  governing_standard_version?: string | null;
};
type Module = { target_hours?: number | null; lessons?: any[] };
type Readiness = {
  ready: boolean;
  blockerCount: number;
  warningCount: number;
  profile: { key: string; label: string; minimumProgramHours: number };
  metrics: Record<string, number>;
  checks: Array<{ key: string; ok: boolean; severity: 'error' | 'warning' | 'info'; message: string }>;
};

const PROFILES = [
  ['internal_basic', 'Internal Basic'],
  ['state_board_strict', 'State Board / Licensure'],
  ['dol_apprenticeship', 'DOL Registered Apprenticeship'],
  ['naadac_peer_support', 'NAADAC / Peer Support'],
  ['custom_regulated', 'Custom Regulated'],
] as const;

export default function CourseGovernancePanel({
  course,
  modules,
  programs,
  onChanged,
}: {
  course: Course;
  modules: Module[];
  programs: Program[];
  onChanged?: () => void | Promise<void>;
}) {
  const [title, setTitle] = useState(course.title ?? '');
  const [description, setDescription] = useState(course.description ?? '');
  const [programId, setProgramId] = useState(course.program_id ?? '');
  const [durationHours, setDurationHours] = useState(course.duration_hours?.toString() ?? '');
  const [passingScore, setPassingScore] = useState(course.passing_score?.toString() ?? '');
  const [profile, setProfile] = useState(course.compliance_profile_key ?? 'internal_basic');
  const [governingBody, setGoverningBody] = useState(course.governing_body ?? '');
  const [governingRegion, setGoverningRegion] = useState(course.governing_region ?? '');
  const [standardVersion, setStandardVersion] = useState(course.governing_standard_version ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);

  useEffect(() => {
    setTitle(course.title ?? '');
    setDescription(course.description ?? '');
    setProgramId(course.program_id ?? '');
    setDurationHours(course.duration_hours?.toString() ?? '');
    setPassingScore(course.passing_score?.toString() ?? '');
    setProfile(course.compliance_profile_key ?? 'internal_basic');
    setGoverningBody(course.governing_body ?? '');
    setGoverningRegion(course.governing_region ?? '');
    setStandardVersion(course.governing_standard_version ?? '');
  }, [course]);

  async function loadReadiness() {
    setLoadingReadiness(true);
    try {
      const response = await fetch(
        `/api/admin/course-builder/readiness?courseId=${encodeURIComponent(course.id)}`,
        { cache: 'no-store' },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Readiness audit failed');
      setReadiness(body);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Readiness audit failed');
    } finally {
      setLoadingReadiness(false);
    }
  }

  useEffect(() => {
    void loadReadiness();
  }, [course.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/course-builder/course-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          title: title.trim(),
          description: description.trim() || null,
          programId: programId || null,
          durationHours: durationHours ? Number(durationHours) : null,
          passingScore: passingScore ? Number(passingScore) : null,
          complianceProfileKey: profile,
          governingBody: governingBody.trim() || null,
          governingRegion: governingRegion.trim() || null,
          governingStandardVersion: standardVersion.trim() || null,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Failed to save course settings');
      setMessage('Course governance settings saved.');
      await onChanged?.();
      await loadReadiness();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save course settings');
    } finally {
      setSaving(false);
    }
  }

  const lessonRows = useMemo(() => modules.flatMap((module) => module.lessons ?? []), [modules]);
  const seatHours =
    lessonRows.reduce(
      (sum, lesson) =>
        sum + Number(lesson.minimum_seat_time_minutes ?? lesson.duration_minutes ?? 0),
      0,
    ) / 60;
  const moduleHours = modules.reduce(
    (sum, module) => sum + Number(module.target_hours ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
              <ShieldCheck className="h-4 w-4" /> Governance
            </div>
            <h2 className="mt-1 text-xl font-bold text-white">Course identity + regulatory controls</h2>
            <p className="mt-1 text-sm text-slate-400">
              These fields are the canonical source used by readiness, compliance, review, versioning,
              and publishing gates.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Course title">
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="control" />
            </Field>
            <Field label="Program">
              <select value={programId} onChange={(event) => setProgramId(event.target.value)} className="control">
                <option value="">No linked program</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Declared training hours">
              <input type="number" min={0} step="0.25" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} className="control" />
            </Field>
            <Field label="Default passing score">
              <input type="number" min={0} max={100} value={passingScore} onChange={(event) => setPassingScore(event.target.value)} className="control" />
            </Field>
            <Field label="Compliance profile">
              <select value={profile} onChange={(event) => setProfile(event.target.value)} className="control">
                {PROFILES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Governing region">
              <input value={governingRegion} onChange={(event) => setGoverningRegion(event.target.value)} placeholder="Indiana" className="control" />
            </Field>
            <Field label="Governing body">
              <input value={governingBody} onChange={(event) => setGoverningBody(event.target.value)} placeholder="USDOL / State Board / Credential body" className="control" />
            </Field>
            <Field label="Standard version">
              <input value={standardVersion} onChange={(event) => setStandardVersion(event.target.value)} placeholder="2026 registered standards / exam outline version" className="control" />
            </Field>
          </div>

          <Field label="Description">
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} className="control resize-y" />
          </Field>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Lessons" value={lessonRows.length} />
            <Metric label="Seat hours" value={seatHours.toFixed(2)} />
            <Metric label="Module target hours" value={moduleHours.toFixed(2)} />
            <Metric label="Declared hours" value={durationHours || '—'} />
          </div>

          {message && (
            <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              {message}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save governance settings'}
          </button>
        </section>

        <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Live readiness audit</h3>
              <p className="text-xs text-slate-500">Audits the actual database course.</p>
            </div>
            <button
              onClick={loadReadiness}
              disabled={loadingReadiness}
              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${loadingReadiness ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {readiness ? (
            <>
              <div className={`rounded-xl border p-4 ${readiness.ready ? 'border-green-800 bg-green-950/30' : 'border-red-900 bg-red-950/30'}`}>
                <div className="flex items-center gap-2">
                  {readiness.ready ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <AlertTriangle className="h-5 w-5 text-red-400" />}
                  <span className="font-bold text-white">
                    {readiness.ready
                      ? 'Ready for publish review'
                      : `${readiness.blockerCount} publish blocker${readiness.blockerCount === 1 ? '' : 's'}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {readiness.profile.label} · minimum {readiness.profile.minimumProgramHours} hours · {readiness.warningCount} warning(s)
                </p>
              </div>

              <div className="space-y-2">
                {readiness.checks.map((check) => (
                  <div
                    key={check.key}
                    className={`rounded-lg border p-3 text-sm ${
                      check.ok
                        ? 'border-green-900/60 bg-green-950/20 text-green-200'
                        : check.severity === 'error'
                          ? 'border-red-900 bg-red-950/30 text-red-200'
                          : 'border-amber-900 bg-amber-950/30 text-amber-200'
                    }`}
                  >
                    <div className="flex gap-2">
                      {check.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                      <span>{check.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-5 text-sm text-slate-500">
              {loadingReadiness ? 'Running readiness audit…' : 'No readiness result yet.'}
            </div>
          )}
        </aside>
      </div>

      <CourseOperationsPanel
        course={{
          id: course.id,
          title: course.title,
          slug: course.slug ?? '',
          review_status: course.review_status,
          status: course.status,
          version: course.version,
          published_at: course.published_at,
          is_active: course.is_active,
        }}
        onChanged={async () => {
          await onChanged?.();
          await loadReadiness();
        }}
      />

      <style jsx>{`
        .control{width:100%;border:1px solid rgb(51 65 85);border-radius:.5rem;background:rgb(2 6 23);padding:.55rem .75rem;color:white;font-size:.875rem}
        .control:focus{outline:none;border-color:rgb(34 211 238);box-shadow:0 0 0 1px rgb(34 211 238)}
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{String(value)}</div>
    </div>
  );
}
