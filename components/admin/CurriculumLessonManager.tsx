'use client';

/**
 * CurriculumLessonManager
 *
 * Admin UI for editing curriculum_lessons rows. Exposes step_type, passing_score,
 * and core lesson fields. Separate from the training_lessons editor at
 * app/admin/lessons/page.tsx — curriculum_lessons is the DB-driven LMS table.
 *
 * Usage: embed in any admin page that manages a course's curriculum.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  BookOpen, ClipboardList, FlaskConical, FileText, Award, GraduationCap,
  ChevronDown, ChevronUp, Save, Plus, Trash2, AlertCircle, CheckCircle2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type StepType = 'lesson' | 'quiz' | 'checkpoint' | 'lab' | 'assignment' | 'exam' | 'certification';
type LessonStatus = 'draft' | 'review' | 'published' | 'archived';

interface CurriculumLesson {
  id: string;
  lesson_slug: string;
  lesson_title: string;
  step_type: StepType;
  passing_score: number;
  module_order: number;
  lesson_order: number;
  duration_minutes: number | null;
  status: LessonStatus;
  script_text: string | null;
  video_file: string | null;
  module_id: string | null;
}

interface Props {
  courseId: string;
  /** Optional: restrict to a single module_order */
  moduleOrder?: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STEP_TYPE_META: Record<StepType, { label: string; icon: React.ReactNode; color: string }> = {
  lesson:        { label: 'Lesson',        icon: <BookOpen className="w-4 h-4" />,      color: 'text-slate-600' },
  quiz:          { label: 'Quiz',          icon: <ClipboardList className="w-4 h-4" />, color: 'text-brand-blue-600' },
  checkpoint:    { label: 'Checkpoint',    icon: <ClipboardList className="w-4 h-4" />, color: 'text-amber-600' },
  lab:           { label: 'Lab',           icon: <FlaskConical className="w-4 h-4" />,  color: 'text-teal-600' },
  assignment:    { label: 'Assignment',    icon: <FileText className="w-4 h-4" />,      color: 'text-purple-600' },
  exam:          { label: 'Exam',          icon: <Award className="w-4 h-4" />,         color: 'text-red-600' },
  certification: { label: 'Certification', icon: <GraduationCap className="w-4 h-4" />, color: 'text-brand-green-600' },
};

const STEP_TYPES_WITH_SCORE: StepType[] = ['quiz', 'checkpoint', 'exam'];

// ── Component ──────────────────────────────────────────────────────────────────

export default function CurriculumLessonManager({ courseId, moduleOrder }: Props) {
  const [lessons, setLessons] = useState<CurriculumLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // lesson id being saved
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, Partial<CurriculumLesson>>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saved' | 'error'>>({});

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from('curriculum_lessons')
        .select('id, lesson_slug, lesson_title, step_type, passing_score, module_order, lesson_order, duration_minutes, status, script_text, video_file, module_id')
        .eq('course_id', courseId)
        .order('module_order')
        .order('lesson_order');

      if (moduleOrder !== undefined) {
        query = query.eq('module_order', moduleOrder);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setLessons((data as CurriculumLesson[]) ?? []);
    } catch (err: any) {
      setError('Failed to load curriculum lessons.');
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleOrder]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const getEdit = (id: string): Partial<CurriculumLesson> => edits[id] ?? {};

  const setField = (id: string, field: keyof CurriculumLesson, value: any) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    setSaveStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const saveLesson = async (lesson: CurriculumLesson) => {
    const patch = edits[lesson.id];
    if (!patch || Object.keys(patch).length === 0) return;

    setSaving(lesson.id);
    try {
      const supabase = createClient();
      const { error: saveError } = await supabase
        .from('curriculum_lessons')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', lesson.id);

      if (saveError) throw saveError;

      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, ...patch } : l));
      setEdits(prev => { const n = { ...prev }; delete n[lesson.id]; return n; });
      setSaveStatus(prev => ({ ...prev, [lesson.id]: 'saved' }));
    } catch {
      setSaveStatus(prev => ({ ...prev, [lesson.id]: 'error' }));
    } finally {
      setSaving(null);
    }
  };

  const merged = (lesson: CurriculumLesson): CurriculumLesson => ({
    ...lesson,
    ...getEdit(lesson.id),
  });

  // Group by module_order for display
  const byModule = lessons.reduce<Record<number, CurriculumLesson[]>>((acc, l) => {
    const m = l.module_order;
    if (!acc[m]) acc[m] = [];
    acc[m].push(l);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
        Loading curriculum lessons…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        No curriculum lessons found for this course.
        <p className="mt-2 text-xs text-slate-400">
          Run the curriculum generator to seed lessons from a blueprint.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(byModule)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([modOrder, modLessons]) => (
          <div key={modOrder} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-700 text-sm">
                Module {modOrder}
                <span className="ml-2 text-slate-400 font-normal">
                  ({modLessons.length} lesson{modLessons.length !== 1 ? 's' : ''})
                </span>
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {modLessons
                .sort((a, b) => a.lesson_order - b.lesson_order)
                .map(lesson => {
                  const m = merged(lesson);
                  const isDirty = Object.keys(getEdit(lesson.id)).length > 0;
                  const isExpanded = expandedId === lesson.id;
                  const meta = STEP_TYPE_META[m.step_type] ?? STEP_TYPE_META.lesson;
                  const showScore = STEP_TYPES_WITH_SCORE.includes(m.step_type);

                  return (
                    <div key={lesson.id} className="bg-white">
                      {/* Row header */}
                      <div
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                        onClick={() => setExpandedId(isExpanded ? null : lesson.id)}
                      >
                        <span className="text-xs text-slate-400 w-8 shrink-0 text-right">
                          {m.module_order}.{m.lesson_order}
                        </span>
                        <span className={`shrink-0 ${meta.color}`}>{meta.icon}</span>
                        <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                          {m.lesson_title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                          m.status === 'published' ? 'bg-brand-green-100 text-brand-green-700' :
                          m.status === 'draft'     ? 'bg-slate-100 text-slate-500' :
                          m.status === 'review'    ? 'bg-amber-100 text-amber-700' :
                                                     'bg-red-100 text-red-600'
                        }`}>
                          {m.status}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${meta.color} bg-slate-50`}>
                          {meta.label}
                        </span>
                        {isDirty && (
                          <span className="text-xs text-amber-600 font-medium shrink-0">unsaved</span>
                        )}
                        {saveStatus[lesson.id] === 'saved' && (
                          <CheckCircle2 className="w-4 h-4 text-brand-green-600 shrink-0" />
                        )}
                        {saveStatus[lesson.id] === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        }
                      </div>

                      {/* Expanded editor */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Lesson title */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Lesson Title
                              </label>
                              <input
                                type="text"
                                value={m.lesson_title}
                                onChange={e => setField(lesson.id, 'lesson_title', e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                              />
                            </div>

                            {/* Step type */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Step Type
                              </label>
                              <select
                                value={m.step_type}
                                onChange={e => setField(lesson.id, 'step_type', e.target.value as StepType)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                              >
                                {(Object.keys(STEP_TYPE_META) as StepType[]).map(t => (
                                  <option key={t} value={t}>{STEP_TYPE_META[t].label}</option>
                                ))}
                              </select>
                            </div>

                            {/* Passing score — only for quiz/checkpoint/exam */}
                            {showScore && (
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                  Passing Score (%)
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={m.passing_score ?? 70}
                                  onChange={e => setField(lesson.id, 'passing_score', Number(e.target.value))}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                  {m.step_type === 'checkpoint'
                                    ? 'Learner must reach this score to unlock the next module.'
                                    : 'Learner must reach this score to mark the lesson complete.'}
                                </p>
                              </div>
                            )}

                            {/* Status */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Status
                              </label>
                              <select
                                value={m.status}
                                onChange={e => setField(lesson.id, 'status', e.target.value as LessonStatus)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
                              >
                                <option value="draft">Draft</option>
                                <option value="review">Review</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>

                            {/* Duration */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Duration (minutes)
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={m.duration_minutes ?? ''}
                                onChange={e => setField(lesson.id, 'duration_minutes', e.target.value ? Number(e.target.value) : null)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                                placeholder="e.g. 15"
                              />
                            </div>

                            {/* Video file */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Video File Path
                              </label>
                              <input
                                type="text"
                                value={m.video_file ?? ''}
                                onChange={e => setField(lesson.id, 'video_file', e.target.value || null)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                                placeholder="e.g. hvac/module1-lesson1.mp4"
                              />
                            </div>

                            {/* Script text */}
                            <div className="md:col-span-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Script / Content
                              </label>
                              <textarea
                                rows={5}
                                value={m.script_text ?? ''}
                                onChange={e => setField(lesson.id, 'script_text', e.target.value || null)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y"
                                placeholder="Lesson script or rich HTML content…"
                              />
                            </div>
                          </div>

                          {/* Slug (read-only) */}
                          <div className="text-xs text-slate-400">
                            Slug: <code className="bg-slate-100 px-1 rounded">{lesson.lesson_slug}</code>
                            &nbsp;·&nbsp;ID: <code className="bg-slate-100 px-1 rounded">{lesson.id}</code>
                          </div>

                          {/* Save button */}
                          <div className="flex justify-end gap-2">
                            {isDirty && (
                              <button
                                onClick={() => setEdits(prev => { const n = { ...prev }; delete n[lesson.id]; return n; })}
                                className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition"
                              >
                                Discard
                              </button>
                            )}
                            <button
                              onClick={() => saveLesson(lesson)}
                              disabled={!isDirty || saving === lesson.id}
                              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                                isDirty && saving !== lesson.id
                                  ? 'bg-brand-blue-600 hover:bg-brand-blue-700 text-white'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Save className="w-3.5 h-3.5" />
                              {saving === lesson.id ? 'Saving…' : 'Save'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
    </div>
  );
}
