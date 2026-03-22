'use client';

/**
 * CurriculumLessonManager
 *
 * Full-course admin builder. Edits course_lessons rows with structured content,
 * objectives, video metadata, assessment questions, evidence requirements,
 * rubric criteria, practical requirements, and competency mappings.
 *
 * Save path:
 *   - course_lessons columns via PATCH /api/admin/lessons/[lessonId]
 *   - lesson_objectives rows (upserted via API)
 *   - lesson_competency_map rows (upserted via API)
 *   - practical_requirements row (upserted via API)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  LESSON_TYPE_META, ASSESSMENT_LESSON_TYPES,
  EVIDENCE_LESSON_TYPES, VIDEO_LESSON_TYPES, type LessonType,
} from '@/lib/curriculum/lesson-types';
import {
  emptyLessonContent, type LessonContent, type VideoConfig,
  type EvidenceRequirement, type RubricCriterion, type PracticalConfig,
} from '@/lib/curriculum/lesson-content-schema';
import { normalizeLessonContent } from '@/lib/curriculum/normalize-lesson-content';

import LessonBasicsEditor from './lesson-editor/LessonBasicsEditor';
import LessonObjectivesEditor from './lesson-editor/LessonObjectivesEditor';
import LessonVideoEditor from './lesson-editor/LessonVideoEditor';
import LessonAssessmentEditor, { type QuizQuestion } from './lesson-editor/LessonAssessmentEditor';
import LessonEvidenceEditor from './lesson-editor/LessonEvidenceEditor';
import LessonRubricEditor from './lesson-editor/LessonRubricEditor';
import LessonPracticalEditor from './lesson-editor/LessonPracticalEditor';
import LessonCompetencyEditor from './lesson-editor/LessonCompetencyEditor';
import { validateLessonSave, isLessonSaveValid } from '@/lib/curriculum/validate-lesson-save';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LessonRow {
  id: string; slug: string; title: string; lesson_type: LessonType;
  status: string; order_index: number; passing_score: number | null;
  duration_minutes?: number | null; module_id: string | null;
  quiz_questions: QuizQuestion[] | null; content: unknown;
  content_structured: unknown; video_file: string | null;
  video_transcript: string | null; video_runtime_seconds: number;
  requires_evidence: boolean; requires_signoff: boolean; requires_evaluator: boolean;
}

interface LessonEditorState {
  title: string; lessonType: LessonType; status: string; durationMinutes: number;
  content: LessonContent; quizQuestions: QuizQuestion[]; passingScore: number;
  videoFile: string; videoTranscript: string; videoRuntime: number;
  requiresEvidence: boolean; requiresSignoff: boolean; requiresEvaluator: boolean;
  objectives: string[]; competencyCodes: string[]; practicalInstructions: string;
}

interface Props { courseId: string; moduleOrder?: number; }

type SectionKey = 'basics' | 'content' | 'objectives' | 'video' | 'assessment' | 'evidence' | 'rubric' | 'practical' | 'competency';

const SECTION_LABELS: Record<SectionKey, string> = {
  basics: 'Basics', content: 'Content', objectives: 'Objectives',
  video: 'Video', assessment: 'Assessment', evidence: 'Evidence',
  rubric: 'Rubric', practical: 'Practical', competency: 'Competencies',
};

function sectionsForType(lt: LessonType): SectionKey[] {
  const base: SectionKey[] = ['basics', 'objectives', 'competency'];
  if (lt === 'video')                           return [...base, 'video', 'content'];
  if (ASSESSMENT_LESSON_TYPES.includes(lt))     return [...base, 'content', 'assessment'];
  if (EVIDENCE_LESSON_TYPES.includes(lt))       return [...base, 'content', 'evidence', 'rubric', 'practical'];
  if (lt === 'certification')                   return ['basics'];
  return [...base, 'content'];
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CurriculumLessonManager({ courseId, moduleOrder }: Props) {
  const [lessons, setLessons]       = useState<LessonRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Record<string, SectionKey>>({});
  const [edits, setEdits]           = useState<Record<string, LessonEditorState>>({});
  const [saving, setSaving]         = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saved' | 'error'>>({});

  const fetchLessons = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const supabase = createClient();
      let query = supabase
        .from('course_lessons')
        .select('id,slug,title,lesson_type,status,order_index,passing_score,module_id,quiz_questions,content,content_structured,video_file,video_transcript,video_runtime_seconds,requires_evidence,requires_signoff,requires_evaluator')
        .eq('course_id', courseId).order('order_index');
      if (moduleOrder !== undefined) query = query.eq('module_id', moduleOrder);
      const { data, error: e } = await query;
      if (e) throw e;
      setLessons((data as LessonRow[]) ?? []);
    } catch { setError('Failed to load lessons.'); }
    finally { setLoading(false); }
  }, [courseId, moduleOrder]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const initEditorState = useCallback(async (lesson: LessonRow): Promise<LessonEditorState> => {
    const supabase = createClient();
    const content = normalizeLessonContent(lesson.content_structured ?? lesson.content);
    const { data: objRows } = await supabase.from('lesson_objectives').select('objective_text,order_index').eq('lesson_id', lesson.id).order('order_index');
    const { data: compRows } = await supabase.from('lesson_competency_map').select('competency_code').eq('lesson_id', lesson.id);
    const { data: prRow } = await supabase.from('practical_requirements').select('*').eq('lesson_id', lesson.id).maybeSingle();
    if (prRow) {
      content.practical = { requiredHours: prRow.required_hours ?? 0, requiredAttempts: prRow.required_attempts ?? 0, requiresEvaluatorApproval: prRow.requires_evaluator_approval ?? false, requiresSkillSignoff: prRow.requires_skill_signoff ?? false, safetyGuidance: prRow.safety_guidance ?? '', materialsNeeded: prRow.materials_needed ?? [] };
      if (Array.isArray(prRow.rubric_json)) content.rubric = prRow.rubric_json;
    }
    return {
      title: lesson.title, lessonType: lesson.lesson_type, status: lesson.status,
      durationMinutes: (lesson as any).duration_minutes ?? 0, content,
      quizQuestions: lesson.quiz_questions ?? [], passingScore: lesson.passing_score ?? 70,
      videoFile: lesson.video_file ?? '', videoTranscript: lesson.video_transcript ?? '',
      videoRuntime: lesson.video_runtime_seconds ?? 0,
      requiresEvidence: lesson.requires_evidence ?? false,
      requiresSignoff: lesson.requires_signoff ?? false,
      requiresEvaluator: lesson.requires_evaluator ?? false,
      objectives: (objRows ?? []).map((r: any) => r.objective_text),
      competencyCodes: (compRows ?? []).map((r: any) => r.competency_code),
      practicalInstructions: prRow?.instructions ?? '',
    };
  }, []);

  const handleExpand = async (lesson: LessonRow) => {
    if (expandedId === lesson.id) { setExpandedId(null); return; }
    setExpandedId(lesson.id);
    if (!edits[lesson.id]) {
      const state = await initEditorState(lesson);
      setEdits(prev => ({ ...prev, [lesson.id]: state }));
      setActiveSection(prev => ({ ...prev, [lesson.id]: 'basics' }));
    }
  };

  const patchEdit = (id: string, patch: Partial<LessonEditorState>) =>
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const patchContent = (id: string, patch: Partial<LessonContent>) => {
    const cur = edits[id]; if (!cur) return;
    patchEdit(id, { content: { ...cur.content, ...patch } });
  };

  const save = async (lessonId: string) => {
    const state = edits[lessonId]; if (!state) return;
    setSaving(lessonId);
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId, title: state.title, lessonType: state.lessonType,
          status: state.status, durationMinutes: state.durationMinutes,
          passingScore: state.passingScore, quizQuestions: state.quizQuestions,
          videoFile: state.videoFile, videoTranscript: state.videoTranscript,
          videoRuntimeSeconds: state.videoRuntime,
          requiresEvidence: state.requiresEvidence, requiresSignoff: state.requiresSignoff,
          requiresEvaluator: state.requiresEvaluator,
          contentStructured: { ...state.content, version: 1 },
          objectives: state.objectives, competencyCodes: state.competencyCodes,
          practicalInstructions: state.practicalInstructions,
          practical: state.content.practical, rubric: state.content.rubric,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? 'Save failed'); }
      setSaveStatus(prev => ({ ...prev, [lessonId]: 'saved' }));
      setTimeout(() => setSaveStatus(prev => { const n = { ...prev }; delete n[lessonId]; return n; }), 3000);
      await fetchLessons();
    } catch (err: any) {
      setSaveStatus(prev => ({ ...prev, [lessonId]: 'error' }));
      setError(err.message ?? 'Save failed');
    } finally { setSaving(null); }
  };

  if (loading) return <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}</div>;
  if (error) return <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>;

  return (
    <div className="space-y-2">
      {lessons.map(lesson => {
        const isOpen = expandedId === lesson.id;
        const state  = edits[lesson.id];
        const meta   = LESSON_TYPE_META[lesson.lesson_type] ?? LESSON_TYPE_META.reading;
        const sections = state ? sectionsForType(state.lessonType) : [];
        const currentSection = (activeSection[lesson.id] ?? 'basics') as SectionKey;
        const isSaving = saving === lesson.id;
        const status = saveStatus[lesson.id];

        return (
          <div key={lesson.id} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${isOpen ? 'bg-slate-50 border-b border-slate-200' : 'hover:bg-slate-50'}`} onClick={() => handleExpand(lesson)}>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.bgColor} ${meta.color}`}>{meta.badge} {meta.shortLabel}</span>
              <span className="flex-1 font-semibold text-sm text-slate-800 truncate">{lesson.title}</span>
              <span className="text-xs text-slate-400 font-mono">#{lesson.order_index}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lesson.status === 'published' ? 'bg-green-100 text-green-700' : lesson.status === 'review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{lesson.status}</span>
              {status === 'saved' && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
              {status === 'error' && <AlertCircle  className="w-4 h-4 text-red-500 flex-shrink-0" />}
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </div>

            {isOpen && state && (
              <div className="flex flex-col md:flex-row">
                <nav className="md:w-36 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50 flex md:flex-col overflow-x-auto">
                  {sections.map(sec => (
                    <button key={sec} type="button" onClick={() => setActiveSection(prev => ({ ...prev, [lesson.id]: sec }))}
                      className={`px-3 py-2 text-xs font-semibold text-left whitespace-nowrap transition flex-shrink-0 ${currentSection === sec ? 'bg-white text-brand-blue-700 border-b-2 md:border-b-0 md:border-l-2 border-brand-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-white'}`}>
                      {SECTION_LABELS[sec]}
                    </button>
                  ))}
                </nav>

                <div className="flex-1 p-4 min-w-0">
                  {currentSection === 'basics' && (
                    <LessonBasicsEditor title={state.title} slug={lesson.slug} lessonType={state.lessonType} status={state.status} durationMinutes={state.durationMinutes} orderIndex={lesson.order_index}
                      onChange={p => patchEdit(lesson.id, { title: p.title ?? state.title, lessonType: p.lessonType ?? state.lessonType, status: p.status ?? state.status, durationMinutes: p.durationMinutes ?? state.durationMinutes })} />
                  )}
                  {currentSection === 'content' && (
                    <div className="space-y-4">
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Summary</label>
                        <textarea value={state.content.summary} onChange={e => patchContent(lesson.id, { summary: e.target.value })} rows={2} placeholder="Brief summary..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" /></div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Instructional Content <span className="text-red-500">*</span></label>
                        <textarea value={state.content.instructionalContent} onChange={e => patchContent(lesson.id, { instructionalContent: e.target.value })} rows={12} placeholder="Full lesson content..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y font-mono" />
                        <p className="text-xs text-slate-400 mt-1">{state.content.instructionalContent.length} chars (min 50 for publish)</p></div>
                      <div><label className="block text-xs font-semibold text-slate-600 mb-1">Activity Instructions</label>
                        <textarea value={state.content.activityInstructions} onChange={e => patchContent(lesson.id, { activityInstructions: e.target.value })} rows={3} placeholder="What should the learner do?" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-y" /></div>
                    </div>
                  )}
                  {currentSection === 'objectives' && (
                    <LessonObjectivesEditor objectives={state.objectives} onChange={objectives => patchEdit(lesson.id, { objectives })} />
                  )}
                  {currentSection === 'video' && (
                    <LessonVideoEditor
                      video={{ videoFile: state.videoFile || undefined, transcript: state.videoTranscript, runtimeSeconds: state.videoRuntime, completionThresholdPercent: state.content.video?.completionThresholdPercent ?? 90, posterImage: state.content.video?.posterImage, captionsFile: state.content.video?.captionsFile }}
                      onChange={video => { patchEdit(lesson.id, { videoFile: video.videoFile ?? '', videoTranscript: video.transcript, videoRuntime: video.runtimeSeconds }); patchContent(lesson.id, { video }); }} />
                  )}
                  {currentSection === 'assessment' && (
                    <LessonAssessmentEditor questions={state.quizQuestions} passingScore={state.passingScore}
                      onChange={quizQuestions => patchEdit(lesson.id, { quizQuestions })}
                      onScoreChange={passingScore => patchEdit(lesson.id, { passingScore })} />
                  )}
                  {currentSection === 'evidence' && (
                    <LessonEvidenceEditor evidence={state.content.evidence}
                      onChange={evidence => { patchContent(lesson.id, { evidence }); patchEdit(lesson.id, { requiresEvidence: evidence.enabled, requiresEvaluator: evidence.reviewerRequired }); }} />
                  )}
                  {currentSection === 'rubric' && (
                    <LessonRubricEditor rubric={state.content.rubric} onChange={rubric => patchContent(lesson.id, { rubric })} />
                  )}
                  {currentSection === 'practical' && (
                    <LessonPracticalEditor lessonType={state.lessonType}
                      practical={state.content.practical ?? { requiredHours: 0, requiredAttempts: 0, requiresEvaluatorApproval: false, requiresSkillSignoff: false, safetyGuidance: '', materialsNeeded: [] }}
                      onChange={practical => { patchContent(lesson.id, { practical }); patchEdit(lesson.id, { requiresEvaluator: practical.requiresEvaluatorApproval, requiresSignoff: practical.requiresSkillSignoff }); }}
                      instructions={state.practicalInstructions}
                      onInstructionsChange={practicalInstructions => patchEdit(lesson.id, { practicalInstructions })} />
                  )}
                  {currentSection === 'competency' && (
                    <LessonCompetencyEditor courseId={courseId} lessonId={lesson.id} mappedCodes={state.competencyCodes} onChange={competencyCodes => patchEdit(lesson.id, { competencyCodes })} />
                  )}

                  {/* Validation errors */}
                  {(() => {
                    const validationErrors = validateLessonSave({
                      title: state.title,
                      lessonType: state.lessonType,
                      videoFile: state.videoFile,
                      videoTranscript: state.videoTranscript,
                      videoRuntime: state.videoRuntime,
                      passingScore: state.passingScore,
                      quizQuestions: state.quizQuestions,
                      requiresEvidence: state.requiresEvidence,
                      practicalInstructions: state.practicalInstructions,
                      objectives: state.objectives,
                    });
                    if (validationErrors.length === 0) return null;
                    return (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
                        {validationErrors.map((e, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            {e}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="text-xs">{status === 'saved' && <span className="text-green-600 font-semibold">✓ Saved</span>}{status === 'error' && <span className="text-red-600 font-semibold">✗ Save failed</span>}</div>
                    <button
                      type="button"
                      onClick={() => save(lesson.id)}
                      disabled={isSaving || !isLessonSaveValid({
                        title: state.title, lessonType: state.lessonType,
                        videoFile: state.videoFile, videoTranscript: state.videoTranscript,
                        videoRuntime: state.videoRuntime, passingScore: state.passingScore,
                        quizQuestions: state.quizQuestions, requiresEvidence: state.requiresEvidence,
                        practicalInstructions: state.practicalInstructions, objectives: state.objectives,
                      })}
                      className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                      title={!isLessonSaveValid({ title: state.title, lessonType: state.lessonType, videoFile: state.videoFile, videoTranscript: state.videoTranscript, videoRuntime: state.videoRuntime, passingScore: state.passingScore, quizQuestions: state.quizQuestions, requiresEvidence: state.requiresEvidence, practicalInstructions: state.practicalInstructions, objectives: state.objectives }) ? 'Fix validation errors before saving' : undefined}
                    >
                      <Save className="w-4 h-4" />{isSaving ? 'Saving...' : 'Save Lesson'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {lessons.length === 0 && <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl"><p className="text-slate-400">No lessons in this course yet.</p></div>}
    </div>
  );
}
