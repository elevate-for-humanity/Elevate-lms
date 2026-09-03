'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, CheckCircle2, FileJson, Loader2, Save, Sparkles } from 'lucide-react';
import { courseBuilderJsonHeaders } from '@/components/admin/course-builder/request';

type Lesson = {
  id: string;
  title: string;
  slug: string;
  content?: string | Record<string, unknown>;
  step_type?: string;
  practical_required?: boolean;
  requires_instructor_signoff?: boolean;
  competency_checks?: unknown;
};

type Module = { id: string; title: string; lessons: Lesson[] };

type Experience = {
  readingGuide?: any;
  content?: string;
  narrationScript?: string;
  visualPrompt?: string;
  flashcards?: any[];
  quickClips?: any[];
  knowledgeChecks?: any[];
  scenario?: any;
  hotspots?: any[];
  dragDrop?: any;
  matching?: any;
  caseStudy?: any;
  simulation?: any;
  decisionTree?: any;
  practicalTask?: any;
  exercises?: any[];
  resources?: any[];
  glossary?: any[];
  remediation?: any;
  readiness?: any;
  interactiveVideo?: any;
};

export default function CourseInteractionStudio({
  courseTitle,
  modules,
}: {
  courseTitle: string;
  modules: Module[];
}) {
  const lessonOptions = useMemo(
    () =>
      modules.flatMap((module) =>
        (module.lessons ?? []).map((lesson) => ({ ...lesson, moduleTitle: module.title })),
      ),
    [modules],
  );
  const [lessonId, setLessonId] = useState(lessonOptions[0]?.id ?? '');
  const [experience, setExperience] = useState<Experience>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [jsonText, setJsonText] = useState('{}');
  const selected = lessonOptions.find((lesson) => lesson.id === lessonId);

  useEffect(() => {
    if (!lessonId && lessonOptions[0]?.id) setLessonId(lessonOptions[0].id);
  }, [lessonOptions, lessonId]);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    setMessage('');
    fetch(`/api/admin/course-builder/interactions?lessonId=${encodeURIComponent(lessonId)}`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? 'Failed to load lesson experience');
        return body;
      })
      .then((body) => {
        const next = body.experience && typeof body.experience === 'object' ? body.experience : {};
        setExperience(next);
        setJsonText(JSON.stringify(next, null, 2));
      })
      .catch((err) =>
        setMessage(err instanceof Error ? err.message : 'Failed to load lesson experience'),
      )
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function generate() {
    if (!selected) return;
    setGenerating(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/course-builder/ai-write', {
        method: 'POST',
        headers: courseBuilderJsonHeaders('ai-write'),
        body: JSON.stringify({
          lessonTitle: selected.title,
          courseTitle,
          moduleTitle: selected.moduleTitle,
          existingContent:
            typeof selected.content === 'string'
              ? selected.content
              : JSON.stringify(selected.content ?? {}),
          instruction:
            'Make this visual, interactive, practical, vocational and suitable for hands-on workforce training. Include realistic safety decisions and observable practical evidence.',
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'AI generation failed');
      const next = body.experience ?? body;
      const sanitized = next as Experience;
      setExperience(sanitized);
      setJsonText(JSON.stringify(sanitized, null, 2));
      setMessage('Interactive lesson experience generated. Review it, then save.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!lessonId) return;
    let parsed: Experience;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setMessage('The experience JSON is invalid. Fix the JSON before saving.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/course-builder/interactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          experience: parsed,
          practicalRequired: !!parsed.practicalTask,
          requiresInstructorSignoff: !!parsed.practicalTask,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Save failed');
      setExperience(parsed);
      setMessage('Saved. This lesson experience is now available to the LMS learner route.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const counts = {
    flashcards: experience.flashcards?.length ?? 0,
    checks: experience.knowledgeChecks?.length ?? 0,
    scenarios: experience.scenario ? 1 : 0,
    practical: experience.practicalTask ? 1 : 0,
    visual: experience.visualPrompt ? 1 : 0,
    audio: experience.narrationScript ? 1 : 0,
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-cyan-400" />
          <h2 className="font-extrabold">Lesson Experience</h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Select a lesson, generate or edit its interactive learning package, then save it to the
          canonical lesson record.
        </p>
        <select
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          {lessonOptions.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.moduleTitle} — {lesson.title}
            </option>
          ))}
        </select>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
          {Object.entries(counts).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-700 bg-slate-950 p-3">
              <div className="text-xl font-black text-white">{value}</div>
              <div className="mt-1 capitalize text-slate-500">{label}</div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={!selected || generating}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 font-extrabold text-slate-950 disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate full experience
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!selected || saving}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-extrabold text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
          to lesson
        </button>
        {message ? (
          <p className="mt-3 rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs font-semibold text-slate-300">
            {message}
          </p>
        ) : null}
      </aside>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-purple-400" />
              <h3 className="font-extrabold">Structured interaction editor</h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Narration, visuals, flashcards, checks, scenarios, hotspots, drag/drop, practicals and
              interactive video use one lesson-experience contract.
            </p>
          </div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          )}
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
          className="mt-4 min-h-[620px] w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-200 outline-none focus:border-cyan-500"
        />
      </section>
    </div>
  );
}
