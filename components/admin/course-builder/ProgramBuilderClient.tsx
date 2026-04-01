'use client';

import { useMemo, useState, useCallback } from 'react';
import CourseBuilderTopBar from './CourseBuilderTopBar';
import ProgramIdentitySection from './ProgramIdentitySection';
import ProgramOutcomesSection from './ProgramOutcomesSection';
import ProgramCertificationsSection from './ProgramCertificationsSection';
import CurriculumTreeSection from './CurriculumTreeSection';
import DeliveryStructureSection from './DeliveryStructureSection';
import EnrollmentCtaSection from './EnrollmentCtaSection';
import ComplianceFundingSection from './ComplianceFundingSection';
import BuilderSidebar from './BuilderSidebar';
import { validateProgram } from './types';
import type { ProgramBuilderState, ProgramDerivedState } from './types';

interface AvailableCredential {
  id: string;
  name: string;
  abbreviation: string | null;
  issuing_authority: string;
}

interface Props {
  initialState: ProgramBuilderState;
  availableCredentials: AvailableCredential[];
}

export default function ProgramBuilderClient({ initialState, availableCredentials }: Props) {
  const [state, setState] = useState<ProgramBuilderState>(initialState);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const derived = useMemo(() => validateProgram(state), [state]);

  const patch = useCallback((update: Partial<ProgramBuilderState>) => {
    setState(prev => ({ ...prev, ...update }));
    setSaveSuccess(false);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/admin/programs/${state.id}/builder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: state.title,
          subtitle: state.subtitle,
          slug: state.slug,
          category: state.category,
          description: state.description,
          hero_image_url: state.hero_image_url,
          estimated_weeks: state.estimated_weeks,
          estimated_hours: state.estimated_hours,
          delivery_method: state.delivery_method,
          wioa_approved: state.wioa_approved,
          dol_registered: state.dol_registered,
          etpl_listed: state.etpl_listed,
          outcomes: state.outcomes,
          credentials: state.credentials,
          phases: state.phases,
          ctas: state.ctas,
          tracks: state.tracks,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Save failed');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!derived.canPublish) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Save first, then publish
      await handleSave();
      const res = await fetch(`/api/admin/programs/${state.id}/publish`, { method: 'POST' });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        // 422 = validation failure — surface the missing list
        const detail = body?.missing?.length
          ? `\n• ${body.missing.join('\n• ')}`
          : '';
        throw new Error((body?.error ?? 'Publish failed') + detail);
      }
      setState(prev => ({ ...prev, status: 'published', published: true }));
    } catch (err: any) {
      setSaveError(err?.message ?? 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky top bar */}
      <CourseBuilderTopBar
        state={state}
        derived={derived}
        saving={saving}
        onSave={handleSave}
        onPublish={handlePublish}
        onPreview={() => setShowPreview(true)}
        onTitleChange={title => patch({ title })}
      />

      {/* Context hero */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">Program Builder</p>
              <h1 className="text-xl font-bold text-slate-900">
                {state.title || 'Untitled Program'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Define outcomes, structure curriculum, and prepare learners for certification.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <Stat label="Phases"  value={derived.totalPhases} />
              <Stat label="Modules" value={derived.totalModules} />
              <Stat label="Lessons" value={derived.totalLessons} highlight={derived.totalLessons < 10} />
              <Stat label="Credentials" value={state.credentials.length} />
              {state.estimated_weeks && <Stat label="Weeks" value={state.estimated_weeks} />}
            </div>
          </div>
        </div>
      </section>

      {/* Save feedback */}
      {(saveError || saveSuccess) && (
        <div className={`border-b px-4 py-2 text-sm text-center ${saveError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {saveError ?? 'Saved successfully'}
        </div>
      )}

      {/* Main grid */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* Editor column */}
          <main className="lg:col-span-8 space-y-6">
            <ProgramIdentitySection state={state} onChange={patch} />
            <ProgramOutcomesSection state={state} onChange={patch} />
            <ProgramCertificationsSection
              state={state}
              availableCredentials={availableCredentials}
              onChange={patch}
            />
            <CurriculumTreeSection state={state} onChange={patch} />
            <DeliveryStructureSection state={state} onChange={patch} />
            <EnrollmentCtaSection state={state} onChange={patch} />
            <ComplianceFundingSection state={state} onChange={patch} />
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <BuilderSidebar
              state={state}
              derived={derived}
              onPreview={() => setShowPreview(true)}
            />
          </aside>
        </div>
      </div>

      {/* Preview drawer */}
      {showPreview && (
        <PreviewDrawer state={state} derived={derived} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className={`text-lg font-bold tabular-nums ${highlight ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

// ── Preview drawer ────────────────────────────────────────────────────────────

function PreviewDrawer({
  state, derived, onClose,
}: {
  state: ProgramBuilderState;
  derived: ProgramDerivedState;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Learner Preview</h2>
            <p className="text-xs text-slate-500">How this program appears to learners</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="flex-1 p-5 space-y-5">
          {/* Hero */}
          {state.hero_image_url && (
            <div className="h-40 w-full overflow-hidden rounded-xl bg-slate-100">
              <img src={state.hero_image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <div>
            <h1 className="text-lg font-bold text-slate-900">{state.title || 'Untitled Program'}</h1>
            {state.subtitle && <p className="text-sm text-slate-500 mt-1">{state.subtitle}</p>}
          </div>

          {/* Stats strip */}
          <div className="flex gap-4 text-sm text-slate-600 border-y border-slate-100 py-3">
            {state.estimated_weeks && <span>{state.estimated_weeks} weeks</span>}
            {state.estimated_hours && <span>{state.estimated_hours} hours</span>}
            {derived.totalLessons > 0 && <span>{derived.totalLessons} lessons</span>}
          </div>

          {/* Credentials */}
          {state.credentials.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Credentials Earned</p>
              <div className="flex flex-wrap gap-2">
                {state.credentials.map(c => (
                  <span key={c.id} className="rounded-full bg-brand-blue-100 px-3 py-1 text-xs font-semibold text-brand-blue-700">
                    {c.credential_abbreviation ?? c.credential_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Outcomes */}
          {state.outcomes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">What You'll Learn</p>
              <ul className="space-y-1.5">
                {state.outcomes.map(o => (
                  <li key={o.id} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-blue-500" />
                    {o.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum outline */}
          {state.phases.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Curriculum</p>
              <div className="space-y-2">
                {state.phases.map(phase => (
                  <div key={phase.id}>
                    <p className="text-xs font-semibold text-slate-700">{phase.title}</p>
                    {phase.modules.map(mod => (
                      <p key={mod.id} className="ml-3 text-xs text-slate-500">
                        {mod.title} · {mod.lessons.length} lessons
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {state.ctas.length > 0 && (
            <div className="pt-2">
              <button className="w-full rounded-xl bg-brand-blue-600 py-3 text-sm font-semibold text-white">
                {state.ctas[0].label}
              </button>
            </div>
          )}

          {/* Compliance badges */}
          {(state.wioa_approved || state.dol_registered || state.etpl_listed) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {state.wioa_approved && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">WIOA Eligible</span>}
              {state.dol_registered && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">DOL Registered</span>}
              {state.etpl_listed && <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">ETPL Listed</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


