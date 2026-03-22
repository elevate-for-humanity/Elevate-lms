'use client';

/**
 * LessonContentRenderer
 *
 * Single canonical entry point for lesson content rendering.
 * Routes entirely by getLessonRenderMode — no inference from video_url,
 * no hybrid step_type/content_type conditionals.
 *
 * HVAC legacy path is isolated behind lesson_source === 'training' and
 * handled by the legacy_hvac branch. All new programs use canonical routing.
 *
 * Hard failure rules (enforced here, not papered over):
 *   - video lesson with no video_file → throws in dev, returns null in prod
 *   - assessment lesson with no questions → throws in dev, returns null in prod
 *   - practical lesson with no instructions → throws in dev, returns null in prod
 */

import React, { useEffect } from 'react';
import { ClipboardList, BookOpen } from 'lucide-react';
import { getLessonRenderMode } from '@/lib/lms/get-lesson-render-mode';
import { normalizeLessonContent } from '@/lib/curriculum/normalize-lesson-content';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';
import { logger } from '@/lib/logger';
import QuizPlayer from '@/components/lms/QuizPlayer';
import InteractiveVideoPlayer from '@/components/lms/InteractiveVideoPlayer';
import PracticalLessonShell from '@/components/lms/PracticalLessonShell';
import { ExplainSimply } from '@/components/lms/ai/ExplainSimply';
import { TranslateToggle } from '@/components/lms/ai/TranslateToggle';
import { HVAC_QUICK_CHECKS } from '@/lib/courses/hvac-quick-checks';
import { lessonUuidToSimulationKey } from '@/lib/lms/hvac-simulations';
import {
  HVAC_LEGACY_RUNTIME_ALLOWED,
  HVAC_LEGACY_RETIREMENT_TARGET,
} from '@/lib/flags/hvacLegacyRetirement';
import dynamic from 'next/dynamic';

const LessonVideoWithSimulation = dynamic(
  () => import('@/components/lms/LessonVideoWithSimulation'),
  { ssr: false }
);

interface Props {
  lesson:      Record<string, unknown>;
  lessonId:    string;
  courseId:    string;
  isCompleted: boolean;
  onComplete:  () => void;
  onQuizComplete: (score: number, answers: Record<string, unknown>) => void;
}

export default function LessonContentRenderer({
  lesson, lessonId, courseId, isCompleted, onComplete, onQuizComplete,
}: Props) {
  const renderConfig = getLessonRenderMode(lesson);
  const { mode, content } = renderConfig;

  // ── Hard failure for missing required data ────────────────────────────────
  // In dev: throw so the problem is immediately visible.
  // In prod: return null (lesson is skipped, not decorated with a placeholder).

  // ── Structured error emission for impossible states ───────────────────────
  // In dev: throw immediately so the problem is visible during development.
  // In prod: log a structured error with full context for monitoring/alerting,
  //          then return null (lesson is skipped, not decorated with a placeholder).
  //          The structured log must include enough context to file a support ticket.

  function handleMissingData(missingField: string): null {
    const ctx = {
      lessonId,
      courseId,
      lessonType: mode,
      lessonTitle: lesson.title as string,
      missingField,
    };
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `[LessonContentRenderer] ${mode} lesson "${lesson.title}" (${lessonId}) ` +
        `is missing required field: ${missingField}. Fix the lesson data — do not add a UI fallback.`
      );
    }
    logger.error('[LessonContentRenderer] Required lesson data missing — lesson skipped', ctx);
    return null;
  }

  if (mode === 'video') {
    const videoFile = (lesson.video_file ?? content.video?.videoFile) as string | undefined;
    if (!videoFile?.trim()) return handleMissingData('video_file');
  }

  if (['quiz', 'checkpoint', 'final_exam'].includes(mode)) {
    const questions = lesson.quiz_questions as unknown[] | null;
    if (!questions?.length) return handleMissingData('quiz_questions');
  }

  if (['lab', 'assignment', 'simulation', 'practicum', 'externship', 'clinical', 'observation', 'capstone'].includes(mode)) {
    const instructions = content.activityInstructions || (lesson.practical_instructions as string | undefined);
    if (!instructions?.trim()) return handleMissingData('activityInstructions');
  }

  // ── Canonical render switch ───────────────────────────────────────────────

  switch (mode) {

    // ── Video ───────────────────────────────────────────────────────────────
    case 'video': {
      const videoFile = (lesson.video_file ?? content.video?.videoFile) as string;
      const transcript = (lesson.video_transcript ?? content.video?.transcript ?? '') as string;
      const simKey = lessonUuidToSimulationKey[lessonId];

      if (simKey) {
        return (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <LessonVideoWithSimulation
              lessonKey={simKey}
              videoUrl={videoFile}
              minimumTimeSeconds={120}
              onMinimumTimeReached={() => {}}
              onSimulationComplete={() => { if (!isCompleted) onComplete(); }}
            />
            {content.instructionalContent && (
              <div className="mt-6 bg-white rounded-xl p-8 shadow-sm">
                <div className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content.instructionalContent) }} />
              </div>
            )}
            {HVAC_QUICK_CHECKS[lessonId] && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-brand-blue-600" />
                  Quick Check
                </h3>
                <QuizPlayer questions={HVAC_QUICK_CHECKS[lessonId]} title="Quick Check"
                  passingScore={60} onComplete={() => {}} />
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <InteractiveVideoPlayer
            videoUrl={videoFile}
            title={lesson.title as string}
            onComplete={() => { if (!isCompleted) onComplete(); }}
          />
          {transcript && (
            <details className="mt-4 border border-slate-200 rounded-lg">
              <summary className="px-4 py-2 text-sm font-semibold text-slate-600 cursor-pointer">
                Transcript
              </summary>
              <div className="px-4 pb-4 text-sm text-slate-600 whitespace-pre-wrap">{transcript}</div>
            </details>
          )}
          {content.instructionalContent && (
            <div className="mt-6 bg-white rounded-xl p-8 shadow-sm">
              <div className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content.instructionalContent) }} />
            </div>
          )}
          {HVAC_QUICK_CHECKS[lessonId] && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-brand-blue-600" />
                Quick Check
              </h3>
              <QuizPlayer questions={HVAC_QUICK_CHECKS[lessonId]} title="Quick Check"
                passingScore={60} onComplete={() => {}} />
            </div>
          )}
        </div>
      );
    }

    // ── Quiz / Checkpoint / Final Exam ───────────────────────────────────────
    case 'quiz':
    case 'checkpoint':
    case 'final_exam': {
      const questions = lesson.quiz_questions as unknown[];
      const passingScore = (lesson.passing_score as number | null) ?? 70;
      return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <QuizPlayer
            questions={questions}
            title={lesson.title as string}
            passingScore={passingScore}
            onComplete={(score, answers) => onQuizComplete(score, answers ?? {})}
          />
        </div>
      );
    }

    // ── Practical types (lab, assignment, simulation, practicum, externship, clinical, observation, capstone) ──
    case 'lab':
    case 'assignment':
    case 'simulation':
    case 'practicum':
    case 'externship':
    case 'clinical':
    case 'observation':
    case 'capstone':
      return (
        <PracticalLessonShell
          lessonId={lessonId}
          courseId={courseId}
          renderConfig={renderConfig}
          onComplete={onComplete}
        />
      );

    // ── Certification ────────────────────────────────────────────────────────
    case 'certification':
      return (
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Course Complete</h2>
          <p className="text-slate-600 mb-6">
            You have completed all required lessons. Your certificate is being prepared.
          </p>
          <button
            onClick={onComplete}
            className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-semibold px-8 py-3 rounded-lg transition"
          >
            View Certificate
          </button>
        </div>
      );

    // ── HVAC legacy path ─────────────────────────────────────────────────────
    // Isolated here. Does not affect any other program.
    //
    // RETIREMENT TARGET: 2027-Q1
    // Gated by HVAC_LEGACY_RUNTIME_ALLOWED in lib/flags/hvacLegacyRetirement.ts.
    // Flip that flag to false to hard-disable this path and surface any missed cutover.
    //
    // Do NOT delete this branch until `pnpm verify:hvac-legacy` passes clean.
    // See: docs/hvac-legacy-retirement-checklist.md
    case 'legacy_hvac': {
      if (!HVAC_LEGACY_RUNTIME_ALLOWED) {
        throw new Error(
          `legacy_hvac runtime path is disabled. ` +
            `Retirement target was ${HVAC_LEGACY_RETIREMENT_TARGET}. ` +
            `All HVAC lessons must be served from curriculum_lessons. ` +
            `Run: pnpm verify:hvac-legacy-retirement`
        );
      }
      const videoUrl = lesson.video_url as string | undefined;
      const simKey = lessonUuidToSimulationKey[lessonId];

      if (simKey && videoUrl) {
        return (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <LessonVideoWithSimulation
              lessonKey={simKey}
              videoUrl={videoUrl}
              minimumTimeSeconds={120}
              onMinimumTimeReached={() => {}}
              onSimulationComplete={() => { if (!isCompleted) onComplete(); }}
            />
            {lesson.content && (
              <div className="mt-6 bg-white rounded-xl p-8 shadow-sm">
                <div className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content as string) }} />
              </div>
            )}
            {HVAC_QUICK_CHECKS[lessonId] && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-brand-blue-600" />
                  Quick Check
                </h3>
                <QuizPlayer questions={HVAC_QUICK_CHECKS[lessonId]} title="Quick Check"
                  passingScore={60} onComplete={() => {}} />
              </div>
            )}
          </div>
        );
      }

      if (videoUrl) {
        return (
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <InteractiveVideoPlayer
              videoUrl={videoUrl}
              title={lesson.title as string}
              onComplete={() => { if (!isCompleted) onComplete(); }}
            />
            {lesson.content && (
              <div className="mt-6 bg-white rounded-xl p-8 shadow-sm">
                <div className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content as string) }} />
              </div>
            )}
            {HVAC_QUICK_CHECKS[lessonId] && (
              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-brand-blue-600" />
                  Quick Check
                </h3>
                <QuizPlayer questions={HVAC_QUICK_CHECKS[lessonId]} title="Quick Check"
                  passingScore={60} onComplete={() => {}} />
              </div>
            )}
          </div>
        );
      }

      // HVAC text-only fallback
      return (
        <div className="bg-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              {lesson.content ? (
                <>
                  <div className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(lesson.content as string) }} />
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                    <ExplainSimply content={lesson.content as string} />
                    <TranslateToggle content={lesson.content as string} />
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    // ── Reading (default) ────────────────────────────────────────────────────
    case 'reading':
    default: {
      const rawContent = (content.instructionalContent || lesson.content) as string | undefined;
      if (!rawContent?.trim()) return handleMissingData('instructionalContent');
      return (
        <div className="bg-white py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(rawContent) }} />
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                <ExplainSimply content={rawContent} />
                <TranslateToggle content={rawContent} />
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
}
