export const revalidate = 86400;

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChapterById, getAdjacentChapters, EBOOK_CHAPTERS } from '@/lib/ebook/barber-chapters';
import type { EbookLesson } from '@/lib/ebook/barber-chapters';
import type { BlueprintQuizQuestion } from '@/lib/curriculum/blueprints/types';

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return EBOOK_CHAPTERS.map((c) => ({ chapter: c.id }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter: chapterId } = await params;
  const chapter = getChapterById(chapterId);
  if (!chapter) return { title: 'Not Found' };
  return {
    title: `Chapter ${chapter.chapterNumber}: ${chapter.shortTitle} | Indiana Barber Theory Ebook`,
    description: `Study guide for ${chapter.shortTitle}. ${chapter.lessons.length} lessons · ${chapter.allQuizQuestions.length} practice questions.`,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StateBoardCallout({ text }: { text: string }) {
  return (
    <div className="my-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 print:border-amber-400">
      <div className="mt-0.5 flex-shrink-0 text-amber-600 font-black text-sm">★</div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-1">
          State Board Focus
        </p>
        <p className="text-sm text-amber-900 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function KeyTermsBox({ terms }: { terms: string[] }) {
  if (!terms.length) return null;
  return (
    <div className="my-6 rounded-xl border border-slate-200 bg-slate-50 p-5 print:border-slate-300">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Key Terms</h4>
      <div className="flex flex-wrap gap-2">
        {terms.map((t) => (
          <span
            key={t}
            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function LessonContent({ lesson, accentColor }: { lesson: EbookLesson; accentColor: string }) {
  // Extract bold terms from content for the key terms box
  const boldTerms: string[] = [];
  if (lesson.content) {
    const matches = lesson.content.matchAll(/<strong>([^<]{2,40})<\/strong>/g);
    for (const m of matches) {
      const term = m[1].trim();
      if (!boldTerms.includes(term)) boldTerms.push(term);
    }
  }

  return (
    <div className="mb-10 print:break-inside-avoid-page">
      {/* Lesson header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ backgroundColor: accentColor }}
        >
          <span className="text-white text-xs font-black">{lesson.order}</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{lesson.title}</h3>
          {lesson.objective && (
            <p className="text-sm text-slate-500 mt-0.5 italic">{lesson.objective}</p>
          )}
        </div>
        {lesson.durationMinutes && (
          <span className="ml-auto text-xs text-slate-400 flex-shrink-0 mt-1">
            {lesson.durationMinutes} min
          </span>
        )}
      </div>

      {/* Lesson body */}
      {lesson.content && (
        <div
          className="prose prose-slate prose-sm max-w-none
            prose-headings:font-bold prose-headings:text-slate-900
            prose-h2:text-xl prose-h3:text-base prose-h4:text-sm
            prose-strong:text-slate-900
            prose-table:text-sm prose-td:py-1.5 prose-th:py-1.5
            prose-ul:my-2 prose-li:my-0.5
            print:prose-sm"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}

      {/* Key terms extracted from bold text */}
      {boldTerms.length >= 3 && <KeyTermsBox terms={boldTerms.slice(0, 12)} />}
    </div>
  );
}

function QuizQuestion({
  q,
  index,
  accentColor,
}: {
  q: BlueprintQuizQuestion;
  index: number;
  accentColor: string;
}) {
  return (
    <div className="mb-6 print:break-inside-avoid">
      <p className="font-semibold text-slate-900 mb-3 text-sm leading-snug">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-black mr-2 flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {index + 1}
        </span>
        {q.question}
      </p>
      <div className="space-y-2 ml-7">
        {q.options.map((opt, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="flex-shrink-0 w-5 h-5 rounded border border-slate-300 bg-white flex items-center justify-center text-xs font-bold text-slate-500 print:border-slate-400">
              {String.fromCharCode(65 + i)}
            </span>
            <span>{opt}</span>
          </div>
        ))}
      </div>
      {/* Answer key — hidden on screen, visible in print via CSS */}
      <p className="mt-2 ml-7 text-xs text-slate-400 print:text-slate-600 hidden print:block">
        Answer: {String.fromCharCode(65 + q.correctAnswer)}
        {q.explanation ? ` — ${q.explanation}` : ''}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BarberEbookChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterId } = await params;
  const chapter = getChapterById(chapterId);
  if (!chapter) notFound();

  const { prev, next } = getAdjacentChapters(chapterId);
  const contentQuestions = chapter.allQuizQuestions.filter(
    (q) => !chapter.checkpoint?.quizQuestions?.some((cq) => cq.id === q.id),
  );
  const checkpointQuestions = chapter.checkpoint?.quizQuestions ?? [];

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Top nav — screen only */}
      <div className="print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
        <Link
          href="/programs/barber-apprenticeship"
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          ← Table of Contents
        </Link>
        <div className="flex items-center gap-2">
          {prev && (
            <Link
              href={`/ebook/barber-theory/${prev.id}`}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ← Ch {prev.chapterNumber}
            </Link>
          )}
          {next && (
            <Link
              href={`/ebook/barber-theory/${next.id}`}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: chapter.color }}
            >
              Ch {next.chapterNumber} →
            </Link>
          )}
          <button
            onClick={() => typeof window !== 'undefined' && window.print()}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Print / PDF
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:px-0 print:py-0">
        {/* Chapter header */}
        <div
          className="rounded-2xl overflow-hidden mb-10 print:rounded-none print:break-before-page"
          style={{ backgroundColor: chapter.color }}
        >
          <div className="px-8 py-10 md:px-12">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3">
              Indiana Barber Theory · Chapter {chapter.chapterNumber} of {EBOOK_CHAPTERS.length}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              {chapter.shortTitle}
            </h1>
            <div className="flex flex-wrap gap-4 text-white/80 text-sm">
              <span>{chapter.lessons.length} lessons</span>
              <span>·</span>
              <span>{chapter.totalDurationMinutes} min</span>
              <span>·</span>
              <span>{chapter.allQuizQuestions.length} practice questions</span>
              {chapter.checkpoint && (
                <>
                  <span>·</span>
                  <span>1 checkpoint quiz</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Lessons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8 print:rounded-none print:border-0 print:p-0">
          <h2 className="text-xl font-black text-slate-900 mb-8 pb-4 border-b border-slate-100">
            Lessons
          </h2>
          {chapter.lessons.map((lesson) => (
            <LessonContent key={lesson.slug} lesson={lesson} accentColor={chapter.color} />
          ))}
        </div>

        {/* Practice questions (from lesson quizzes) */}
        {contentQuestions.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8 print:rounded-none print:border-0 print:p-0 print:break-before-page">
            <h2 className="text-xl font-black text-slate-900 mb-2">Practice Questions</h2>
            <p className="text-sm text-slate-500 mb-8">
              {contentQuestions.length} questions · Circle the best answer
            </p>
            {contentQuestions.map((q, i) => (
              <QuizQuestion key={q.id} q={q} index={i} accentColor={chapter.color} />
            ))}
          </div>
        )}

        {/* Checkpoint quiz */}
        {chapter.checkpoint && checkpointQuestions.length > 0 && (
          <div
            className="rounded-2xl border-2 p-6 sm:p-8 mb-8 print:rounded-none print:border-0 print:p-0 print:break-before-page"
            style={{ borderColor: chapter.color, backgroundColor: chapter.accentBg }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: chapter.color }}
              >
                <span className="text-white text-xs font-black">✓</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">{chapter.checkpoint.title}</h2>
            </div>
            <p className="text-sm text-slate-600 mb-2 ml-11">
              {checkpointQuestions.length} questions · Passing score:{' '}
              {chapter.checkpoint.passingScore ?? 70}%
            </p>
            {chapter.checkpoint.objective && (
              <p className="text-sm text-slate-500 italic mb-8 ml-11">
                {chapter.checkpoint.objective}
              </p>
            )}
            <div className="ml-0 mt-6">
              {checkpointQuestions.map((q, i) => (
                <QuizQuestion key={q.id} q={q} index={i} accentColor={chapter.color} />
              ))}
            </div>
          </div>
        )}

        {/* Chapter nav — screen only */}
        <div className="print:hidden flex items-center justify-between gap-4 py-8 border-t border-slate-200">
          {prev ? (
            <Link
              href={`/ebook/barber-theory/${prev.id}`}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              ← Chapter {prev.chapterNumber}: {prev.shortTitle}
            </Link>
          ) : (
            <Link
              href="/programs/barber-apprenticeship"
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Table of Contents
            </Link>
          )}
          {next ? (
            <Link
              href={`/ebook/barber-theory/${next.id}`}
              className="flex items-center gap-2 text-sm font-semibold text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
              style={{ backgroundColor: chapter.color }}
            >
              Chapter {next.chapterNumber}: {next.shortTitle} →
            </Link>
          ) : (
            <Link
              href="/programs/barber-apprenticeship"
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Back to Contents →
            </Link>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page { margin: 0.75in; size: letter; }
          body { font-size: 11pt; color: #0f172a; }
          a { color: inherit; text-decoration: none; }
          .prose table { border-collapse: collapse; width: 100%; }
          .prose td, .prose th { border: 1px solid #cbd5e1; padding: 6px 8px; }
          .prose th { background: #f1f5f9; font-weight: 700; }
        }
      `}</style>
    </div>
  );
}
