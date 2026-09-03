'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';
import { ArrowRight, BookOpen, CheckCircle, Loader2, Search, Sparkles } from 'lucide-react';

type BlueprintTemplate = {
  id: string;
  title: string;
  credentialCode?: string | null;
  state?: string | null;
  slug: string;
  modules: number;
  lessons: number;
  status?: string | null;
  socCode?: string | null;
};

export default function TemplateGallery() {
  const router = useRouter();
  const [templates, setTemplates] = useState<BlueprintTemplate[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BlueprintTemplate | null>(null);
  const [programName, setProgramName] = useState('');
  const [programCode, setProgramCode] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [fundingEligible, setFundingEligible] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/course-builder?action=blueprints', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load course blueprints');
        if (!cancelled) setTemplates(Array.isArray(data.blueprints) ? data.blueprints : []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Unable to load course blueprints');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return templates;
    return templates.filter((template) =>
      [template.title, template.slug, template.credentialCode, template.state, template.socCode]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [search, templates]);

  function choose(template: BlueprintTemplate) {
    setSelected(template);
    setProgramName(template.title);
    setProgramCode(
      (template.credentialCode || template.slug).toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
    );
    setDurationWeeks('');
    setFundingEligible(true);
    setError('');
  }

  async function buildSelected() {
    if (!selected) return;
    setBuilding(true);
    setError('');
    try {
      const programResponse = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: programCode || selected.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
          title: programName || selected.title,
          funding_eligible: fundingEligible,
          duration_weeks: durationWeeks ? Number.parseInt(durationWeeks, 10) : null,
          status: 'draft',
          category: 'Workforce Training',
        }),
      });
      const programData = await programResponse.json();
      if (!programResponse.ok) throw new Error(programData.error || 'Unable to create program');
      const programId = programData.data?.id ?? programData.id;
      if (!programId) throw new Error('Program creation completed without a program ID');

      const courseResponse = await fetch('/api/admin/course-builder', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('generate-from-blueprint'),
        body: JSON.stringify({
          action: 'generate-from-blueprint',
          blueprintId: selected.id,
          programId,
          mode: 'refresh',
          contentSource: 'ai',
          videoMode: 'queue',
        }),
      });
      const courseData = await courseResponse.json();
      if (!courseResponse.ok || !courseData.ok) {
        throw new Error(
          (courseData.errors ?? [courseData.error ?? 'Course build failed']).join('; '),
        );
      }
      if (!courseData.courseId) throw new Error('Course Factory completed without a course ID');
      router.push(`/studio/courses/${courseData.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to build the course');
      setBuilding(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-red-600">
            Course Builder
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Choose a canonical blueprint</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Every blueprint is loaded from the canonical registry and built through the same Course
            Factory, including complete lessons, assessments, interactions, narration, media,
            validation, and persistence.
          </p>
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search credential, program, state, or SOC code"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-brand-red-500"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <section>
          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-brand-red-600" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => choose(template)}
                  className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    selected?.id === template.id
                      ? 'border-brand-red-500 ring-2 ring-brand-red-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-slate-950 p-2 text-white">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    {template.status === 'active' || template.status === 'published' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : null}
                  </div>
                  <h2 className="mt-4 font-black text-slate-950">{template.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{template.slug}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <span>{template.modules} modules</span>
                    <span>{template.lessons} lessons</span>
                    <span>{template.state || 'Multi-state'}</span>
                    <span>{template.credentialCode || 'Credential blueprint'}</span>
                  </div>
                </button>
              ))}
              {!filtered.length ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No canonical blueprints match this search.
                </div>
              ) : null}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-brand-red-600">
            <Sparkles className="h-4 w-4" /> Build through Course Factory
          </div>
          {selected ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Blueprint</p>
                <p className="font-black text-slate-950">{selected.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.modules} modules · {selected.lessons} lessons
                </p>
              </div>
              <label className="block text-xs font-bold text-slate-700">
                Program name
                <input
                  value={programName}
                  onChange={(event) => setProgramName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Program code
                <input
                  value={programCode}
                  onChange={(event) => setProgramCode(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-normal"
                />
              </label>
              <label className="block text-xs font-bold text-slate-700">
                Duration in weeks
                <input
                  type="number"
                  min={1}
                  value={durationWeeks}
                  onChange={(event) => setDurationWeeks(event.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={fundingEligible}
                  onChange={(event) => setFundingEligible(event.target.checked)}
                />
                Funding eligible
              </label>
              <button
                type="button"
                disabled={building}
                onClick={buildSelected}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-4 py-3 font-black text-white hover:bg-brand-red-700 disabled:opacity-60"
              >
                {building ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {building ? 'Building complete course…' : 'Use blueprint'}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Select a blueprint to create the program and send the complete build through the
              unified Course Factory.
            </p>
          )}
          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </aside>
      </main>
    </div>
  );
}
