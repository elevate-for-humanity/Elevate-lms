/**
 * HVAC Lesson Page — visual-first learning layout.
 * Full-width video hero → key concept callout → diagram → script → interactive quiz → nav.
 */

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getAllHvacLessons, getHvacLesson } from '@/lib/courses/hvac-csv-loader';
import { HVAC_LESSON_UUID } from '@/lib/courses/hvac-uuids';
import { HVAC_QUIZ_MAP } from '@/lib/courses/hvac-quizzes';
import { EPA_608_LESSON_TAGS } from '@/lib/courses/hvac-epa-tags';
import HvacVideoPlayer from '@/components/lms/HvacVideoPlayer';
import HvacQuizBlock from '@/components/lms/HvacQuizBlock';

export async function generateStaticParams() {
  return getAllHvacLessons().map(l => ({ lessonId: l.lessonId }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ lessonId: string }> }
): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = getHvacLesson(lessonId);
  if (!lesson) return { title: 'Lesson Not Found' };
  return {
    title: `${lesson.lessonTitle} | HVAC Training`,
    description: lesson.keyConcept,
  };
}

export default async function HvacLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const lesson = getHvacLesson(lessonId);
  if (!lesson) notFound();

  const allLessons    = getAllHvacLessons();
  const currentIdx    = allLessons.findIndex(l => l.lessonId === lesson.lessonId);
  const prevLesson    = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson    = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
  const moduleLessons = allLessons.filter(l => l.module === lesson.module);
  const moduleIdx     = moduleLessons.findIndex(l => l.lessonId === lesson.lessonId);

  const uuid       = HVAC_LESSON_UUID[lesson.lessonId];
  const videoUrl   = lesson.videoFile ? `/${lesson.videoFile}` : uuid ? `/hvac/videos/lesson-${uuid}.mp4` : null;
  const audioUrl   = lesson.audioFile ? `/${lesson.audioFile}` : uuid ? `/hvac/audio/lesson-${uuid}.mp3` : null;
  const diagramUrl = lesson.diagramFile ? `/hvac/diagrams/${lesson.diagramFile}` : null;

  // Derive caption URL from video path (same UUID, .vtt extension)
  const captionUrl = videoUrl
    ? videoUrl.replace('/hvac/videos/', '/hvac/captions/').replace('.mp4', '.vtt')
    : null;

  const quizQuestions = HVAC_QUIZ_MAP[lesson.lessonId] ?? null;
  const epaTags       = EPA_608_LESSON_TAGS[lesson.lessonId] ?? [];

  // Break script into readable paragraphs
  const scriptParagraphs = lesson.scriptText
    ? lesson.scriptText.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Slim top nav ── */}
      <nav className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Link href="/hvac" className="hover:text-white transition-colors">← HVAC Course</Link>
          <span className="text-slate-700">/</span>
          <span className="text-sky-400 truncate max-w-[200px]">{lesson.module}</span>
        </div>
        <div className="flex items-center gap-3">
          {epaTags.map(tag => (
            <span key={tag} className="bg-amber-900/50 border border-amber-600/50 text-amber-300 text-xs font-bold px-2 py-0.5 rounded">
              EPA {tag}
            </span>
          ))}
          <span className="text-slate-500 text-xs">{lesson.durationMin} min</span>
        </div>
      </nav>

      {/* ── HERO: Full-width video ── */}
      <div className="w-full bg-black">
        {videoUrl ? (
          <HvacVideoPlayer
            videoUrl={videoUrl}
            audioUrl={audioUrl}
            posterUrl={diagramUrl ?? ''}
            title={lesson.lessonTitle}
            captionUrl={captionUrl}
          />
        ) : audioUrl ? (
          <div className="max-w-4xl mx-auto px-4 py-8">
            <audio controls preload="metadata" className="w-full">
              <source src={audioUrl} type="audio/mpeg" />
            </audio>
          </div>
        ) : diagramUrl ? (
          <div className="relative w-full aspect-video bg-slate-900">
            <Image src={diagramUrl} alt={lesson.lessonTitle} fill className="object-contain" />
          </div>
        ) : null}
      </div>

      {/* ── Title + progress ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white">{lesson.lessonTitle}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-slate-400 text-sm">{lesson.module}</span>
            <span className="text-slate-600 text-xs">Lesson {lesson.lessonOrder} of {moduleLessons.length}</span>
          </div>
          <div className="mt-3 h-1 bg-slate-800 rounded-full">
            <div
              className="h-1 bg-sky-500 rounded-full"
              style={{ width: `${((moduleIdx + 1) / moduleLessons.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── KEY CONCEPT — first thing they read ── */}
        {lesson.keyConcept && (
          <div className="bg-sky-950 border-l-4 border-sky-400 rounded-r-2xl px-6 py-5">
            <p className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-2">Key Concept</p>
            <p className="text-white text-xl font-semibold leading-snug">{lesson.keyConcept}</p>
          </div>
        )}

        {/* ── DIAGRAM ── */}
        {diagramUrl && (
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">System Diagram</p>
            <div className="rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
              <Image
                src={diagramUrl}
                alt={`${lesson.lessonTitle} diagram`}
                width={1200}
                height={675}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* ── LESSON CONTENT — scannable, not a wall of text ── */}
        {scriptParagraphs.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Lesson Content</p>
            <div className="space-y-4">
              {scriptParagraphs.map((para, i) => {
                const isHeader = para.endsWith(':') && para.length < 80;
                if (isHeader) {
                  return <h3 key={i} className="text-sky-300 font-bold text-base mt-6 first:mt-0">{para}</h3>;
                }
                if (para.includes('\n-') || para.startsWith('-') || para.startsWith('•')) {
                  return (
                    <ul key={i} className="space-y-2">
                      {para.split('\n').filter(Boolean).map((item, j) => (
                        <li key={j} className="flex gap-3 text-slate-300 text-sm leading-relaxed">
                          <span className="text-sky-500 mt-1 flex-shrink-0">▸</span>
                          <span>{item.replace(/^[-•]\s*/, '')}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i} className="text-slate-300 text-sm leading-relaxed">{para}</p>;
              })}
            </div>
          </div>
        )}

        {/* ── EPA 608 CALLOUT ── */}
        {epaTags.length > 0 && (
          <div className="bg-amber-950/40 border border-amber-700/40 rounded-2xl px-6 py-5">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
              EPA 608 Exam Content — {epaTags.join(' · ')}
            </p>
            <p className="text-amber-100 text-sm leading-relaxed">
              This lesson covers material tested on the EPA Section 608 exam.
              {epaTags.includes('Type I') && ' Type I: small appliances ≤5 lbs.'}
              {epaTags.includes('Type II') && ' Type II: high-pressure systems (R-22, R-410A).'}
              {epaTags.includes('Type III') && ' Type III: low-pressure chillers (R-11, R-123).'}
              {epaTags.includes('Universal') && ' Universal: Core + all three Type exams.'}
            </p>
          </div>
        )}

        {/* ── KNOWLEDGE CHECK — interactive ── */}
        {quizQuestions && quizQuestions.length > 0 ? (
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Knowledge Check</p>
            <HvacQuizBlock questions={quizQuestions.slice(0, 5)} />
          </div>
        ) : lesson.quizQuestion ? (
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Knowledge Check</p>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
              <p className="text-white font-semibold mb-3">{lesson.quizQuestion}</p>
              <details className="cursor-pointer">
                <summary className="text-sky-400 text-sm font-medium select-none">Show answer</summary>
                <p className="text-green-300 text-sm mt-2">{lesson.quizAnswer}</p>
              </details>
            </div>
          </div>
        ) : null}

        {/* ── PREV / NEXT ── */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
          {prevLesson ? (
            <Link
              href={`/hvac/lesson/${prevLesson.lessonId}`}
              aria-label={`Previous lesson: ${prevLesson.lessonTitle}`}
              className="flex flex-col items-start gap-1 bg-slate-800 hover:bg-slate-700 px-5 py-3 rounded-xl transition-colors max-w-[45%]"
            >
              <span className="text-slate-500 text-xs">← Previous</span>
              <span className="text-white text-sm font-semibold truncate">{prevLesson.lessonTitle}</span>
            </Link>
          ) : <div />}

          {nextLesson ? (
            <Link
              href={`/hvac/lesson/${nextLesson.lessonId}`}
              aria-label={`Next lesson: ${nextLesson.lessonTitle}`}
              className="flex flex-col items-end gap-1 bg-sky-700 hover:bg-sky-600 px-5 py-3 rounded-xl transition-colors max-w-[45%]"
            >
              <span className="text-sky-200 text-xs">Next →</span>
              <span className="text-white text-sm font-semibold truncate">{nextLesson.lessonTitle}</span>
            </Link>
          ) : (
            <Link href="/hvac" className="bg-green-700 hover:bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors">
              Module Complete ✓
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
