'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type InputMode = 'prompt' | 'syllabus';

interface FormState {
  mode: InputMode;
  prompt: string;
  courseTitle: string;
  audience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessonCount: number;
  durationHours: number;
  tone: string;
  includeQuiz: boolean;
  includeReflection: boolean;
}

interface GenerationResult {
  courseId: string;
  courseTitle: string;
  slug: string;
  lessonCount: number;
  lessons: { id: string; title: string; lesson_number: number }[];
  learningObjectives: string[];
  adminUrl: string;
  warnings?: string[];
}

const DEFAULTS: FormState = {
  mode: 'prompt',
  prompt: '',
  courseTitle: '',
  audience: '',
  difficulty: 'beginner',
  lessonCount: 6,
  durationHours: 4,
  tone: '',
  includeQuiz: true,
  includeReflection: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AICourseBuilderForm() {
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.prompt.trim()) return;

    setStatus('generating');
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/admin/courses/ai-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: form.prompt.trim(),
          courseTitle: form.courseTitle.trim() || undefined,
          audience: form.audience.trim() || undefined,
          difficulty: form.difficulty,
          lessonCount: form.lessonCount,
          durationHours: form.durationHours || undefined,
          tone: form.tone.trim() || undefined,
          includeQuiz: form.includeQuiz,
          includeReflection: form.includeReflection,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setResult(data);
      setStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Generation failed');
      setStatus('error');
    }
  }

  function handleReset() {
    setForm(DEFAULTS);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }

  const isGenerating = status === 'generating';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Courses', href: '/admin/courses' },
          { label: 'AI Builder' },
        ]} />

        {/* Header */}
        <div className="mt-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-brand-blue-600" />
            AI Course Builder
          </h1>
          <p className="text-gray-500 mt-1">
            Enter a prompt or paste a syllabus — the AI generates a complete course draft saved directly to the LMS.
          </p>
        </div>

        {/* Success state */}
        {status === 'success' && result && (
          <div className="mb-8 bg-white rounded-xl border-2 border-green-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <h2 className="text-xl font-bold text-slate-900">Course Created</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Course Title</p>
                <p className="font-semibold text-slate-900">{result.courseTitle}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Lessons Created</p>
                <p className="font-semibold text-slate-900">{result.lessonCount}</p>
              </div>
            </div>

            {/* Learning objectives */}
            {result.learningObjectives?.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Learning Objectives</p>
                <ul className="space-y-1">
                  {result.learningObjectives.map((obj, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="text-brand-blue-500 mt-0.5">•</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Lesson list */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Lessons</p>
              <ol className="space-y-1">
                {result.lessons.map(l => (
                  <li key={l.id} className="text-sm text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-blue-100 text-brand-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {l.lesson_number}
                    </span>
                    {l.title}
                  </li>
                ))}
              </ol>
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-yellow-800 mb-1">Partial warnings</p>
                {result.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-700">{w}</p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={result.adminUrl}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors font-medium text-sm"
              >
                <BookOpen className="h-4 w-4" />
                Open in Course Editor
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/admin/courses"
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                View All Courses
              </Link>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Build Another
              </button>
            </div>
          </div>
        )}

        {/* Form — hidden after success */}
        {status !== 'success' && (
          <form onSubmit={handleGenerate} className="space-y-6">

            {/* Mode toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => set('mode', 'prompt')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.mode === 'prompt'
                      ? 'bg-brand-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Prompt Mode
                </button>
                <button
                  type="button"
                  onClick={() => set('mode', 'syllabus')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    form.mode === 'syllabus'
                      ? 'bg-brand-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Paste Syllabus / Script
                </button>
              </div>

              {form.mode === 'prompt' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Describe the course you want
                  </label>
                  <textarea
                    value={form.prompt}
                    onChange={e => set('prompt', e.target.value)}
                    rows={4}
                    required
                    disabled={isGenerating}
                    placeholder='Example: "Build a 6-module workforce readiness course for young adults entering the trades. Include learning objectives, practical exercises, and short quizzes."'
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y disabled:opacity-50"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Paste syllabus, script, outline, or training notes
                  </label>
                  <textarea
                    value={form.prompt}
                    onChange={e => set('prompt', e.target.value)}
                    rows={12}
                    required
                    disabled={isGenerating}
                    placeholder="Paste your syllabus, lesson script, training outline, or raw notes here. The AI will structure it into a complete course."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y disabled:opacity-50"
                  />
                </div>
              )}
            </div>

            {/* Structured options */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Course Title <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.courseTitle}
                    onChange={e => set('courseTitle', e.target.value)}
                    disabled={isGenerating}
                    placeholder="AI will generate one if blank"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Target Audience <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.audience}
                    onChange={e => set('audience', e.target.value)}
                    disabled={isGenerating}
                    placeholder="e.g. Young adults entering the trades"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Difficulty
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={e => set('difficulty', e.target.value as FormState['difficulty'])}
                    disabled={isGenerating}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Number of Lessons
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.lessonCount}
                    onChange={e => set('lessonCount', parseInt(e.target.value, 10) || 6)}
                    disabled={isGenerating}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-6 mt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includeQuiz}
                    onChange={e => set('includeQuiz', e.target.checked)}
                    disabled={isGenerating}
                    className="w-4 h-4 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Include quiz questions per lesson</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includeReflection}
                    onChange={e => set('includeReflection', e.target.checked)}
                    disabled={isGenerating}
                    className="w-4 h-4 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Include reflection prompts</span>
                </label>
              </div>

              {/* Advanced options toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="mt-5 flex items-center gap-1.5 text-sm text-brand-blue-600 hover:underline"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAdvanced ? 'Hide' : 'Show'} advanced options
              </button>

              {showAdvanced && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Estimated Duration (hours)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      max={200}
                      step={0.5}
                      value={form.durationHours}
                      onChange={e => set('durationHours', parseFloat(e.target.value) || 4)}
                      disabled={isGenerating}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Tone / Style <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.tone}
                      onChange={e => set('tone', e.target.value)}
                      disabled={isGenerating}
                      placeholder="e.g. Practical, conversational, formal"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm">Generation failed</p>
                  <p className="text-red-700 text-sm mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isGenerating || !form.prompt.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating course…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Course
                  </>
                )}
              </button>

              {isGenerating && (
                <p className="text-sm text-gray-500">
                  This takes 20–60 seconds. The AI is writing {form.lessonCount} lessons.
                </p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
