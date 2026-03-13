'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { GeneratedCourse, GeneratedLesson, GeneratedModule } from '@/app/api/admin/courses/generate/route';

interface Program { id: string; name: string; category: string; }

type Stage = 'intake' | 'generating' | 'review';

export default function CourseGeneratorClient({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('intake');
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'prompt'>('text');
  const [textInput, setTextInput] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState<File | null>(null);
  const [programId, setProgramId] = useState('');
  const [error, setError] = useState('');
  const [course, setCourse] = useState<GeneratedCourse | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  // ── Intake ────────────────────────────────────────────────────────────────

  async function handleGenerate() {
    setError('');
    setStage('generating');

    try {
      let raw_text = '';
      let input_type = 'syllabus';

      if (inputMode === 'file' && fileData) {
        const form = new FormData();
        form.append('file', fileData);
        const parseRes = await fetch('/api/admin/courses/generate/parse', {
          method: 'POST', body: form,
        });
        const parsed = await parseRes.json();
        if (!parseRes.ok) throw new Error(parsed.error || 'Parse failed');
        raw_text = parsed.raw_text;
        input_type = parsed.input_type;
      } else if (inputMode === 'prompt') {
        raw_text = promptInput.trim();
        input_type = 'prompt';
      } else {
        raw_text = textInput.trim();
        input_type = 'syllabus';
      }

      if (!raw_text) throw new Error('No input provided');

      const genRes = await fetch('/api/admin/courses/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text, input_type }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Generation failed');

      setCourse(genData.course);
      setStage('review');
    } catch (e: any) {
      setError(e.message);
      setStage('intake');
    }
  }

  // ── Course field edits ────────────────────────────────────────────────────

  function updateCourse(patch: Partial<GeneratedCourse>) {
    setCourse(c => c ? { ...c, ...patch } : c);
  }

  function updateLesson(modIdx: number, lessonIdx: number, patch: Partial<GeneratedLesson>) {
    setCourse(c => {
      if (!c) return c;
      const modules = c.modules.map((mod, mi) => {
        if (mi !== modIdx) return mod;
        return {
          ...mod,
          lessons: mod.lessons.map((l, li) =>
            li === lessonIdx ? { ...l, ...patch } : l
          ),
        };
      });
      return { ...c, modules };
    });
  }

  function updateModule(modIdx: number, patch: Partial<GeneratedModule>) {
    setCourse(c => {
      if (!c) return c;
      return {
        ...c,
        modules: c.modules.map((m, i) => i === modIdx ? { ...m, ...patch } : m),
      };
    });
  }

  function moveLessonUp(modIdx: number, lessonIdx: number) {
    if (lessonIdx === 0) return;
    setCourse(c => {
      if (!c) return c;
      const modules = c.modules.map((mod, mi) => {
        if (mi !== modIdx) return mod;
        const lessons = [...mod.lessons];
        [lessons[lessonIdx - 1], lessons[lessonIdx]] = [lessons[lessonIdx], lessons[lessonIdx - 1]];
        return { ...mod, lessons };
      });
      return { ...c, modules };
    });
  }

  function moveLessonDown(modIdx: number, lessonIdx: number, total: number) {
    if (lessonIdx >= total - 1) return;
    setCourse(c => {
      if (!c) return c;
      const modules = c.modules.map((mod, mi) => {
        if (mi !== modIdx) return mod;
        const lessons = [...mod.lessons];
        [lessons[lessonIdx], lessons[lessonIdx + 1]] = [lessons[lessonIdx + 1], lessons[lessonIdx]];
        return { ...mod, lessons };
      });
      return { ...c, modules };
    });
  }

  // ── Regenerate single lesson ──────────────────────────────────────────────

  async function regenerateLesson(modIdx: number, lessonIdx: number) {
    if (!course) return;
    const lesson = course.modules[modIdx].lessons[lessonIdx];
    const flatIdx = course.modules
      .slice(0, modIdx)
      .reduce((s, m) => s + m.lessons.length, 0) + lessonIdx;
    setRegeneratingIdx(flatIdx);
    setError('');
    try {
      const res = await fetch('/api/admin/courses/generate/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_number: lesson.lesson_number,
          lesson_title: lesson.title,
          module_title: course.modules[modIdx].title,
          course_title: course.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Regenerate failed');
      updateLesson(modIdx, lessonIdx, data.lesson);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRegeneratingIdx(null);
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async function handlePublish(is_published: boolean) {
    if (!course) return;
    setPublishing(true);
    setError('');
    try {
      const res = await fetch('/api/admin/courses/generate/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course, program_id: programId || undefined, is_published }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Publish failed');
      router.push(`/admin/courses/${data.courseId}/content`);
    } catch (e: any) {
      setError(e.message);
      setPublishing(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (stage === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-4 border-brand-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-600 font-medium">Generating course structure…</p>
        <p className="text-slate-400 text-sm">This takes 20–40 seconds</p>
      </div>
    );
  }

  if (stage === 'review' && course) {
    return <ReviewScreen
      course={course}
      programs={programs}
      programId={programId}
      setProgramId={setProgramId}
      updateCourse={updateCourse}
      updateModule={updateModule}
      updateLesson={updateLesson}
      moveLessonUp={moveLessonUp}
      moveLessonDown={moveLessonDown}
      regenerateLesson={regenerateLesson}
      regeneratingIdx={regeneratingIdx}
      publishing={publishing}
      error={error}
      onPublish={handlePublish}
      onBack={() => setStage('intake')}
    />;
  }

  // Intake screen
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      {/* Mode tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-4">
        {(['text', 'file', 'prompt'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              inputMode === mode
                ? 'bg-brand-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {mode === 'text' ? 'Paste Syllabus / Script'
              : mode === 'file' ? 'Upload PDF / DOCX'
              : 'Plain-English Prompt'}
          </button>
        ))}
      </div>

      {/* Input area */}
      {inputMode === 'text' && (
        <textarea
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          placeholder="Paste your syllabus, training script, or course outline here…"
          className="w-full h-64 border border-slate-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      )}

      {inputMode === 'prompt' && (
        <textarea
          value={promptInput}
          onChange={e => setPromptInput(e.target.value)}
          placeholder="Describe the course you want to create. Example: A 6-week HVAC fundamentals course for beginners covering refrigeration cycles, electrical basics, and EPA 608 exam prep."
          className="w-full h-40 border border-slate-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      )}

      {inputMode === 'file' && (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-brand-blue-400 transition"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) { setFileData(f); setFileName(f.name); }
            }}
          />
          {fileName ? (
            <p className="text-slate-700 font-medium">{fileName}</p>
          ) : (
            <>
              <p className="text-slate-500 font-medium">Click to upload PDF or DOCX</p>
              <p className="text-slate-400 text-sm mt-1">Max 10MB</p>
            </>
          )}
        </div>
      )}

      {/* Program selector */}
      {programs.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Attach to program <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            value={programId}
            onChange={e => setProgramId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">No program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={
          (inputMode === 'text' && !textInput.trim()) ||
          (inputMode === 'prompt' && !promptInput.trim()) ||
          (inputMode === 'file' && !fileData)
        }
        className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition"
      >
        Generate Course
      </button>
    </div>
  );
}

// ── Review screen ─────────────────────────────────────────────────────────────

interface ReviewProps {
  course: GeneratedCourse;
  programs: Program[];
  programId: string;
  setProgramId: (v: string) => void;
  updateCourse: (p: Partial<GeneratedCourse>) => void;
  updateModule: (mi: number, p: Partial<GeneratedModule>) => void;
  updateLesson: (mi: number, li: number, p: Partial<GeneratedLesson>) => void;
  moveLessonUp: (mi: number, li: number) => void;
  moveLessonDown: (mi: number, li: number, total: number) => void;
  regenerateLesson: (mi: number, li: number) => void;
  regeneratingIdx: number | null;
  publishing: boolean;
  error: string;
  onPublish: (published: boolean) => void;
  onBack: () => void;
}

function ReviewScreen({
  course, programs, programId, setProgramId,
  updateCourse, updateModule, updateLesson,
  moveLessonUp, moveLessonDown, regenerateLesson,
  regeneratingIdx, publishing, error, onPublish, onBack,
}: ReviewProps) {
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  let flatIdx = 0;

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to intake
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => onPublish(false)}
            disabled={publishing}
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
          >
            Save as Draft
          </button>
          <button
            onClick={() => onPublish(true)}
            disabled={publishing}
            className="px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-40"
          >
            {publishing ? 'Publishing…' : 'Publish Course'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Course metadata */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Course Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
            <input
              value={course.title}
              onChange={e => updateCourse({ title: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Subtitle</label>
            <input
              value={course.subtitle}
              onChange={e => updateCourse({ subtitle: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <textarea
              value={course.description}
              onChange={e => updateCourse({ description: e.target.value })}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Audience</label>
            <input
              value={course.audience}
              onChange={e => updateCourse({ audience: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select
              value={course.category}
              onChange={e => updateCourse({ category: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {['healthcare','trades','technology','business','transportation','personal-services','tax'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Duration (hours)</label>
            <input
              type="number" min={1}
              value={course.duration_hours}
              onChange={e => updateCourse({ duration_hours: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Passing score (%)</label>
            <input
              type="number" min={50} max={100}
              value={course.passing_score}
              onChange={e => updateCourse({ passing_score: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {programs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Attach to program</label>
              <select
                value={programId}
                onChange={e => setProgramId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">No program</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400">{course.modules.length} modules · {totalLessons} lessons</p>
      </div>

      {/* Modules + lessons */}
      {course.modules.map((mod, mi) => (
        <div key={mi} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Module {mi + 1}</span>
            <input
              value={mod.title}
              onChange={e => updateModule(mi, { title: e.target.value })}
              className="flex-1 bg-transparent border-none text-slate-800 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue-400 rounded px-1"
            />
          </div>

          <div className="divide-y divide-slate-100">
            {mod.lessons.map((lesson, li) => {
              const currentFlatIdx = flatIdx++;
              const isRegenerating = regeneratingIdx === currentFlatIdx;
              return (
                <LessonEditor
                  key={li}
                  lesson={lesson}
                  lessonIdx={li}
                  totalInModule={mod.lessons.length}
                  isRegenerating={isRegenerating}
                  onChange={patch => updateLesson(mi, li, patch)}
                  onMoveUp={() => moveLessonUp(mi, li)}
                  onMoveDown={() => moveLessonDown(mi, li, mod.lessons.length)}
                  onRegenerate={() => regenerateLesson(mi, li)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom publish bar */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={() => onPublish(false)}
          disabled={publishing}
          className="px-6 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
        >
          Save as Draft
        </button>
        <button
          onClick={() => onPublish(true)}
          disabled={publishing}
          className="px-6 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-40"
        >
          {publishing ? 'Publishing…' : 'Publish Course'}
        </button>
      </div>
    </div>
  );
}

// ── Lesson editor ─────────────────────────────────────────────────────────────

function LessonEditor({
  lesson, lessonIdx, totalInModule, isRegenerating,
  onChange, onMoveUp, onMoveDown, onRegenerate,
}: {
  lesson: GeneratedLesson;
  lessonIdx: number;
  totalInModule: number;
  isRegenerating: boolean;
  onChange: (p: Partial<GeneratedLesson>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRegenerate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`px-6 py-4 ${isRegenerating ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Reorder */}
        <div className="flex flex-col gap-0.5 pt-1">
          <button
            onClick={onMoveUp}
            disabled={lessonIdx === 0}
            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
            title="Move up"
          >▲</button>
          <button
            onClick={onMoveDown}
            disabled={lessonIdx >= totalInModule - 1}
            className="text-slate-300 hover:text-slate-600 disabled:opacity-20 text-xs leading-none"
            title="Move down"
          >▼</button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-400 font-mono w-6">{lesson.lesson_number}</span>
            <input
              value={lesson.title}
              onChange={e => onChange({ title: e.target.value })}
              className="flex-1 text-sm font-medium text-slate-800 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-blue-400 rounded px-1"
            />
            <span className="text-xs text-slate-400 shrink-0">{lesson.duration_minutes}m</span>
            <select
              value={lesson.content_type}
              onChange={e => onChange({ content_type: e.target.value as GeneratedLesson['content_type'] })}
              className="text-xs border border-slate-200 rounded px-1 py-0.5 text-slate-600"
            >
              {['video','reading','quiz','assignment'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <input
            value={lesson.description}
            onChange={e => onChange({ description: e.target.value })}
            placeholder="Lesson description"
            className="w-full text-xs text-slate-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-brand-blue-400 rounded px-1 mb-2"
          />

          <button
            onClick={() => setExpanded(x => !x)}
            className="text-xs text-brand-blue-600 hover:underline"
          >
            {expanded ? 'Hide content & quiz' : `Edit content & ${lesson.quiz_questions?.length ?? 0} quiz questions`}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Lesson content / narration script</label>
                <textarea
                  value={lesson.content}
                  onChange={e => onChange({ content: e.target.value })}
                  rows={6}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  Quiz questions ({lesson.quiz_questions?.length ?? 0})
                </label>
                {(lesson.quiz_questions ?? []).map((q, qi) => (
                  <div key={qi} className="border border-slate-200 rounded-lg p-3 mb-2 space-y-2">
                    <input
                      value={q.question}
                      onChange={e => {
                        const qs = [...(lesson.quiz_questions ?? [])];
                        qs[qi] = { ...qs[qi], question: e.target.value };
                        onChange({ quiz_questions: qs });
                      }}
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1"
                      placeholder="Question"
                    />
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={q.correct_index === oi}
                          onChange={() => {
                            const qs = [...(lesson.quiz_questions ?? [])];
                            qs[qi] = { ...qs[qi], correct_index: oi };
                            onChange({ quiz_questions: qs });
                          }}
                          title="Mark as correct"
                        />
                        <input
                          value={opt}
                          onChange={e => {
                            const qs = [...(lesson.quiz_questions ?? [])];
                            const opts = [...qs[qi].options];
                            opts[oi] = e.target.value;
                            qs[qi] = { ...qs[qi], options: opts };
                            onChange({ quiz_questions: qs });
                          }}
                          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1"
                          placeholder={`Option ${oi + 1}`}
                        />
                      </div>
                    ))}
                    <input
                      value={q.explanation}
                      onChange={e => {
                        const qs = [...(lesson.quiz_questions ?? [])];
                        qs[qi] = { ...qs[qi], explanation: e.target.value };
                        onChange({ quiz_questions: qs });
                      }}
                      className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-500"
                      placeholder="Explanation for correct answer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="shrink-0 text-xs text-slate-400 hover:text-brand-blue-600 border border-slate-200 rounded px-2 py-1 hover:border-brand-blue-300 transition"
          title="Regenerate this lesson"
        >
          {isRegenerating ? '…' : '↺ Regen'}
        </button>
      </div>
    </div>
  );
}
