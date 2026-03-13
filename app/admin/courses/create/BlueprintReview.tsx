'use client';

import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Clock, Layers, BookOpen, HelpCircle, Award, Plus, Trash2,
} from 'lucide-react';
import type { CourseBlueprint, ModuleBlueprint, LessonBlueprint, QuizQuestionBlueprint } from '@/lib/ai/course-ingestion';

interface Props {
  initial: CourseBlueprint;
  error: string | null;
  onBack: () => void;
  onSave: (edited: CourseBlueprint) => void;
}

// Minimal inline text input used throughout
function InlineField({
  value, onChange, placeholder, multiline = false, className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const base = `w-full border border-transparent hover:border-gray-300 focus:border-brand-blue-400 focus:ring-1 focus:ring-brand-blue-400 rounded px-2 py-1 text-sm bg-transparent focus:bg-white transition-colors outline-none ${className}`;
  return multiline ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className={base + ' resize-y'}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={base}
    />
  );
}

export default function BlueprintReview({ initial, error, onBack, onSave }: Props) {
  const [bp, setBp] = useState<CourseBlueprint>(() => JSON.parse(JSON.stringify(initial)));
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [showQuiz, setShowQuiz] = useState(false);

  const set = (patch: Partial<CourseBlueprint>) => setBp((b) => ({ ...b, ...patch }));

  const toggleModule = (i: number) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  // ── Module helpers ──────────────────────────────────────────────────────────
  const updateModule = (mi: number, patch: Partial<ModuleBlueprint>) =>
    setBp((b) => {
      const modules = [...b.modules];
      modules[mi] = { ...modules[mi], ...patch };
      return { ...b, modules };
    });

  const updateLesson = (mi: number, li: number, patch: Partial<LessonBlueprint>) =>
    setBp((b) => {
      const modules = [...b.modules];
      const lessons = [...modules[mi].lessons];
      lessons[li] = { ...lessons[li], ...patch };
      modules[mi] = { ...modules[mi], lessons };
      return { ...b, modules };
    });

  const addLesson = (mi: number) =>
    setBp((b) => {
      const modules = [...b.modules];
      const lessons = [...modules[mi].lessons, {
        title: 'New Lesson',
        description: '',
        content: '',
        order_index: modules[mi].lessons.length,
        duration_minutes: 20,
        content_type: 'text' as const,
      }];
      modules[mi] = { ...modules[mi], lessons };
      return { ...b, modules };
    });

  const removeLesson = (mi: number, li: number) =>
    setBp((b) => {
      const modules = [...b.modules];
      const lessons = modules[mi].lessons.filter((_, i) => i !== li);
      modules[mi] = { ...modules[mi], lessons };
      return { ...b, modules };
    });

  const addModule = () =>
    setBp((b) => ({
      ...b,
      modules: [...b.modules, {
        title: 'New Module',
        description: '',
        order_index: b.modules.length,
        lessons: [
          { title: 'Lesson 1', description: '', content: '', order_index: 0, duration_minutes: 20, content_type: 'text' as const },
          { title: 'Lesson 2', description: '', content: '', order_index: 1, duration_minutes: 20, content_type: 'text' as const },
        ],
      }],
    }));

  const removeModule = (mi: number) =>
    setBp((b) => ({ ...b, modules: b.modules.filter((_, i) => i !== mi) }));

  // ── Objective helpers ───────────────────────────────────────────────────────
  const updateObjective = (i: number, val: string) =>
    setBp((b) => {
      const learning_objectives = [...b.learning_objectives];
      learning_objectives[i] = val;
      return { ...b, learning_objectives };
    });

  const addObjective = () =>
    setBp((b) => ({ ...b, learning_objectives: [...b.learning_objectives, ''] }));

  const removeObjective = (i: number) =>
    setBp((b) => ({ ...b, learning_objectives: b.learning_objectives.filter((_, j) => j !== i) }));

  // ── Quiz helpers ────────────────────────────────────────────────────────────
  const updateQuestion = (qi: number, patch: Partial<QuizQuestionBlueprint>) =>
    setBp((b) => {
      const quiz_questions = [...b.quiz_questions];
      quiz_questions[qi] = { ...quiz_questions[qi], ...patch };
      return { ...b, quiz_questions };
    });

  const updateOption = (qi: number, oi: number, val: string) =>
    setBp((b) => {
      const quiz_questions = [...b.quiz_questions];
      const options = [...quiz_questions[qi].options];
      // if this was the correct answer, update it too
      const wasCorrect = options[oi] === quiz_questions[qi].correct_answer;
      options[oi] = val;
      quiz_questions[qi] = {
        ...quiz_questions[qi],
        options,
        correct_answer: wasCorrect ? val : quiz_questions[qi].correct_answer,
      };
      return { ...b, quiz_questions };
    });

  const addQuestion = () =>
    setBp((b) => ({
      ...b,
      quiz_questions: [...b.quiz_questions, {
        question_text: '',
        question_type: 'multiple_choice' as const,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        points: 1,
      }],
    }));

  const removeQuestion = (qi: number) =>
    setBp((b) => ({ ...b, quiz_questions: b.quiz_questions.filter((_, i) => i !== qi) }));

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalLessons = bp.modules?.reduce((s, m) => s + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Draft — not published
              </span>
              <span className="text-xs text-gray-400 capitalize">
                Detected: {bp.detected_source_type}
              </span>
            </div>
            <InlineField
              value={bp.title}
              onChange={(v) => set({ title: v })}
              placeholder="Course title"
              className="text-xl font-bold text-gray-900"
            />
            <InlineField
              value={bp.subtitle || ''}
              onChange={(v) => set({ subtitle: v })}
              placeholder="One-line subtitle"
              className="text-gray-500 mt-1"
            />
          </div>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 border rounded-lg px-3 py-1.5 shrink-0"
          >
            ← Edit input
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox icon={Layers} label="Modules" value={bp.modules?.length ?? 0} />
          <StatBox icon={BookOpen} label="Lessons" value={totalLessons} />
          <StatBox icon={Clock} label="Est. hours">
            <input
              type="number"
              min={0}
              step={0.5}
              value={bp.estimated_duration_hours ?? ''}
              onChange={(e) => set({ estimated_duration_hours: parseFloat(e.target.value) || 0 })}
              className="w-16 text-lg font-bold text-gray-900 border-b border-dashed border-gray-300 focus:outline-none focus:border-brand-blue-400 bg-transparent"
            />
          </StatBox>
          <StatBox icon={HelpCircle} label="Quiz questions" value={bp.quiz_questions?.length ?? 0} />
        </div>
      </div>

      {/* Warnings */}
      {bp.warnings?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            Review before publishing
          </div>
          {bp.warnings.map((w, i) => (
            <p key={i} className="text-sm text-yellow-700 pl-6">• {w}</p>
          ))}
        </div>
      )}

      {/* Course details */}
      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-900">Course details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <InlineField
              value={bp.description || ''}
              onChange={(v) => set({ description: v })}
              placeholder="Course description"
              multiline
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Skill level</label>
              <select
                value={bp.skill_level || 'beginner'}
                onChange={(e) => set({ skill_level: e.target.value as CourseBlueprint['skill_level'] })}
                className="w-full border rounded px-2 py-1 text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              <InlineField
                value={bp.category || ''}
                onChange={(v) => set({ category: v })}
                placeholder="e.g. Trades, Healthcare, Technology"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Target audience</label>
              <InlineField
                value={bp.target_audience || ''}
                onChange={(v) => set({ target_audience: v })}
                placeholder="Who this course is for"
              />
            </div>
          </div>
        </div>

        {/* Learning objectives */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500">Learning objectives</label>
            <button onClick={addObjective} className="text-xs text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          <div className="space-y-1">
            {bp.learning_objectives?.map((obj, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <InlineField
                  value={obj}
                  onChange={(v) => updateObjective(i, v)}
                  placeholder="Learning objective"
                  className="flex-1"
                />
                <button onClick={() => removeObjective(i)} className="text-gray-300 hover:text-red-400 shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate */}
        <div className="flex items-start gap-3 pt-2 border-t">
          <input
            type="checkbox"
            id="cert_toggle"
            checked={bp.certificate_enabled}
            onChange={(e) => set({ certificate_enabled: e.target.checked })}
            className="h-4 w-4 mt-0.5 rounded border-gray-300 text-brand-blue-600 focus:ring-brand-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="cert_toggle" className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <Award className="w-4 h-4 text-brand-blue-600" /> Certificate of completion
            </label>
            {bp.certificate_enabled && (
              <InlineField
                value={bp.certificate_title || ''}
                onChange={(v) => set({ certificate_title: v })}
                placeholder="Certificate title"
                className="mt-1 text-gray-600"
              />
            )}
          </div>
        </div>
      </div>

      {/* Module / lesson tree */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Course structure</h3>
            <p className="text-sm text-gray-500">{bp.modules?.length} modules · {totalLessons} lessons</p>
          </div>
          <button
            onClick={addModule}
            className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 border border-brand-blue-200 rounded-lg px-3 py-1.5"
          >
            <Plus className="w-4 h-4" /> Add module
          </button>
        </div>
        <div className="divide-y">
          {bp.modules?.map((mod, mi) => (
            <div key={mi}>
              <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50">
                <button onClick={() => toggleModule(mi)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                  <span className="w-7 h-7 rounded-full bg-brand-blue-100 text-brand-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {mi + 1}
                  </span>
                  <InlineField
                    value={mod.title}
                    onChange={(v) => updateModule(mi, { title: v })}
                    placeholder="Module title"
                    className="font-medium text-gray-900 flex-1"
                  />
                  <span className="text-xs text-gray-400 shrink-0">{mod.lessons?.length ?? 0} lessons</span>
                  {expandedModules.has(mi)
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                <button onClick={() => removeModule(mi)} className="text-gray-300 hover:text-red-400 shrink-0 ml-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expandedModules.has(mi) && (
                <div className="bg-gray-50 border-t divide-y divide-gray-100">
                  {/* Module description */}
                  <div className="px-8 py-2">
                    <InlineField
                      value={mod.description || ''}
                      onChange={(v) => updateModule(mi, { description: v })}
                      placeholder="Module description (optional)"
                      className="text-xs text-gray-500"
                    />
                  </div>
                  {mod.lessons?.map((lesson, li) => (
                    <div key={li} className="px-8 py-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5 shrink-0">{li + 1}</span>
                        <InlineField
                          value={lesson.title}
                          onChange={(v) => updateLesson(mi, li, { title: v })}
                          placeholder="Lesson title"
                          className="font-medium text-gray-800 flex-1"
                        />
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={1}
                            value={lesson.duration_minutes}
                            onChange={(e) => updateLesson(mi, li, { duration_minutes: parseInt(e.target.value) || 20 })}
                            className="w-12 text-xs text-gray-500 border-b border-dashed border-gray-300 focus:outline-none focus:border-brand-blue-400 bg-transparent text-right"
                          />
                          <span className="text-xs text-gray-400">min</span>
                        </div>
                        <button onClick={() => removeLesson(mi, li)} className="text-gray-300 hover:text-red-400 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="pl-5">
                        <InlineField
                          value={lesson.description || ''}
                          onChange={(v) => updateLesson(mi, li, { description: v })}
                          placeholder="Lesson description"
                          className="text-xs text-gray-500"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="px-8 py-2">
                    <button
                      onClick={() => addLesson(mi)}
                      className="text-xs text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quiz */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <button
          onClick={() => setShowQuiz((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-blue-600" />
            <span className="font-semibold text-gray-900">
              {bp.quiz_title || 'Course Assessment'} · {bp.quiz_questions?.length ?? 0} questions
            </span>
          </div>
          {showQuiz ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showQuiz && (
          <div className="border-t px-6 py-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Quiz title</label>
                <InlineField
                  value={bp.quiz_title || ''}
                  onChange={(v) => set({ quiz_title: v })}
                  placeholder="Quiz title"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Passing score %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bp.quiz_passing_score ?? 70}
                  onChange={(e) => set({ quiz_passing_score: parseInt(e.target.value) || 70 })}
                  className="w-20 border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            {bp.quiz_questions?.map((q, qi) => (
              <div key={qi} className="border rounded-lg p-4 space-y-2 bg-gray-50">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 mt-1.5 shrink-0">Q{qi + 1}</span>
                  <InlineField
                    value={q.question_text}
                    onChange={(v) => updateQuestion(qi, { question_text: v })}
                    placeholder="Question text"
                    className="flex-1 font-medium text-gray-800"
                  />
                  <button onClick={() => removeQuestion(qi)} className="text-gray-300 hover:text-red-400 shrink-0 mt-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="pl-5 space-y-1">
                  {q.options?.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correct_answer === opt}
                        onChange={() => updateQuestion(qi, { correct_answer: opt })}
                        className="h-3.5 w-3.5 text-brand-blue-600 border-gray-300 focus:ring-brand-blue-500"
                        title="Mark as correct answer"
                      />
                      <InlineField
                        value={opt}
                        onChange={(v) => updateOption(qi, oi, v)}
                        placeholder={`Option ${oi + 1}`}
                        className={`flex-1 text-sm ${q.correct_answer === opt ? 'text-green-700 font-medium' : 'text-gray-700'}`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 pl-5">Select radio button to mark correct answer</p>
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add question
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => onSave(bp)}
          className="flex-1 bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700 font-medium text-sm"
        >
          Save as draft course
        </button>
        <button
          onClick={onBack}
          className="px-6 py-3 border rounded-lg hover:bg-gray-50 text-gray-700 text-sm"
        >
          Start over
        </button>
      </div>
    </div>
  );
}

function StatBox({
  icon: Icon, label, value, children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | number;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
      <Icon className="w-5 h-5 text-brand-blue-600 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        {children ?? <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>}
      </div>
    </div>
  );
}
