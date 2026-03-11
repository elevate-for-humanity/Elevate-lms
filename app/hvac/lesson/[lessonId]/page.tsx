/**
 * Dynamic HVAC lesson template.
 * Loads ALL lesson data from data/hvac-master-curriculum.csv.
 * One template serves all 95 lessons — no hardcoded lesson pages.
 *
 * Columns read from CSV:
 *   Lesson_ID, Module, Lesson_Order, Lesson_Title, Script_Text,
 *   Diagram_File, Video_File, Audio_File, Quiz_Question, Quiz_Answer,
 *   Key_Concept, Lesson_Duration_Min
 *
 * Media paths (canonical):
 *   Video:   /hvac/videos/lesson-{uuid}.mp4
 *   Audio:   /hvac/audio/lesson-{uuid}.mp3
 *   Diagram: /hvac/diagrams/{Diagram_File}
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAllHvacLessons, getHvacLesson } from '@/lib/courses/hvac-csv-loader';
import { HVAC_LESSON_UUID } from '@/lib/courses/hvac-uuids';
import { HVAC_QUIZ_MAP } from '@/lib/courses/hvac-quizzes';
import { EPA_608_LESSON_TAGS } from '@/lib/courses/hvac-epa-tags';

// ── Static params — pre-render all 95 lesson pages ───────────────────────────
export async function generateStaticParams() {
  const lessons = getAllHvacLessons();
  return lessons.map(l => ({ lessonId: l.lessonId }));
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ lessonId: string }> }
): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getHvacLesson(lessonId);
  if (!lesson) return { title: 'Lesson Not Found' };
  return {
    title: `${lesson.lessonTitle} | HVAC Training | Elevate for Humanity`,
    description: lesson.keyConcept,
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function HvacLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getHvacLesson(lessonId);
  if (!lesson) notFound();

  const allLessons = getAllHvacLessons();
  const currentIdx = allLessons.findIndex(l => l.lessonId === lesson.lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  // Resolve UUID → canonical media paths
  const uuid = HVAC_LESSON_UUID[lesson.lessonId];
  const videoUrl  = uuid ? `/hvac/videos/lesson-${uuid}.mp4`  : null;
  const audioUrl  = uuid ? `/hvac/audio/lesson-${uuid}.mp3`   : null;
  const diagramUrl = `/hvac/diagrams/${lesson.diagramFile}`;

  // Quiz questions from HVAC_QUIZ_MAP (keyed by lessonId)
  const quizQuestions = HVAC_QUIZ_MAP[lesson.lessonId] ?? null;

  // EPA 608 tags for this lesson
  const epaTags = EPA_608_LESSON_TAGS[lesson.lessonId] ?? [];

  // Module progress
  const moduleLessons = allLessons.filter(l => l.module === lesson.module);
  const moduleIdx = moduleLessons.findIndex(l => l.lessonId === lesson.lessonId);

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* ── Top nav ── */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <Link href="/hvac" className="text-slate-400 hover:text-white">← HVAC Course</Link>
          <span className="text-slate-600">/</span>
          <span className="text-sky-400 font-semibold">{lesson.module}</span>
        </div>
        <span className="text-slate-400 text-sm">
          Lesson {lesson.lessonOrder} · {lesson.durationMin} min
        </span>
      </div>

      {/* ── Lesson title bar ── */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{lesson.lessonTitle}</h1>
            <p className="text-slate-400 text-sm mt-1">{lesson.module}</p>
          </div>
          {/* EPA 608 tags */}
          {epaTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {epaTags.map(tag => (
                <span key={tag} className="bg-amber-900/40 border border-amber-600/50 text-amber-300 text-xs font-semibold px-2 py-1 rounded">
                  EPA 608 {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Module progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Module progress</span>
            <span>{moduleIdx + 1} / {moduleLessons.length}</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full">
            <div
              className="h-1.5 bg-sky-500 rounded-full transition-all"
              style={{ width: `${((moduleIdx + 1) / moduleLessons.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── SPEC LAYOUT: instructor left | diagram right | concept bottom ── */}
        {videoUrl ? (
          <div className="rounded-xl overflow-hidden shadow-2xl bg-black">
            <video
              controls
              className="w-full aspect-video"
              poster={diagramUrl}
            >
              <source src={videoUrl} type="video/mp4" />
              {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
            </video>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-800 border border-slate-700 aspect-video flex items-center justify-center">
            <p className="text-slate-500">Video not yet available for this lesson</p>
          </div>
        )}

        {/* ── Two-column: Script_Text left | Diagram right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT: Script_Text from CSV — real teaching content */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-sky-400 font-bold text-lg mb-4">Lesson Content</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {lesson.scriptText}
            </div>
          </div>

          {/* RIGHT: Diagram from /hvac/diagrams/ */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-sky-400 font-bold text-lg mb-4">System Diagram</h2>
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-700">
              <Image
                src={diagramUrl}
                alt={`${lesson.lessonTitle} diagram`}
                fill
                className="object-contain p-2"
              />
            </div>
          </div>
        </div>

        {/* ── BOTTOM: Key Concept from CSV ── */}
        <div className="bg-slate-700 rounded-xl p-5 border-l-4 border-sky-500">
          <p className="text-sky-400 font-bold text-xs uppercase tracking-widest mb-2">Key Concept</p>
          <p className="text-white text-base leading-relaxed">{lesson.keyConcept}</p>
        </div>

        {/* ── EPA 608 content block (when tagged) ── */}
        {epaTags.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-600/40 rounded-xl p-5">
            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
              EPA 608 — {epaTags.join(' · ')}
            </p>
            <p className="text-amber-100 text-sm leading-relaxed">
              This lesson covers content tested on the EPA Section 608 Technician Certification exam.
              {epaTags.includes('Type I') && ' Type I covers small appliances with 5 lbs or less of refrigerant.'}
              {epaTags.includes('Type II') && ' Type II covers high-pressure systems including R-22 and R-410A residential equipment.'}
              {epaTags.includes('Type III') && ' Type III covers low-pressure chillers using R-11 and R-123.'}
              {epaTags.includes('Universal') && ' Universal certification requires passing Core, Type I, Type II, and Type III.'}
            </p>
          </div>
        )}

        {/* ── Quiz: 5 questions from HVAC_QUIZ_MAP or CSV fallback ── */}
        <div className="bg-slate-800 rounded-xl p-6">
          <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-4">Knowledge Check</p>

          {quizQuestions && quizQuestions.length > 0 ? (
            <div className="space-y-6">
              {quizQuestions.slice(0, 5).map((q, qi) => (
                <div key={q.id} className="border border-slate-700 rounded-lg p-4">
                  <p className="text-white font-semibold mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                          oi === q.correctAnswer
                            ? 'border-green-500 bg-green-900/20 text-green-300'
                            : 'border-slate-600 bg-slate-700 text-slate-300'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          oi === q.correctAnswer ? 'bg-green-600 text-white' : 'bg-slate-600 text-slate-300'
                        }`}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                        {oi === q.correctAnswer && (
                          <span className="ml-auto text-green-400 text-xs font-semibold">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-slate-400 text-xs mt-3 italic">{q.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* CSV fallback — single Q&A when quiz bank not yet expanded */
            <div className="border border-slate-700 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">{lesson.quizQuestion}</p>
              <p className="text-green-300 text-sm">
                <span className="text-slate-400">Answer: </span>{lesson.quizAnswer}
              </p>
            </div>
          )}
        </div>

        {/* ── Prev / Next navigation ── */}
        <div className="flex justify-between items-center pt-2">
          {prevLesson ? (
            <Link
              href={`/hvac/lesson/${prevLesson.lessonId}`}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              ← {prevLesson.lessonTitle}
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link
              href={`/hvac/lesson/${nextLesson.lessonId}`}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              {nextLesson.lessonTitle} →
            </Link>
          ) : (
            <Link
              href="/hvac"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              Course Complete ✓
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
