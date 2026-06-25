'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { getChapterById, getAdjacentChapters, EBOOK_CHAPTERS } from '@/lib/ebook/barber-chapters';
import type { EbookLesson, EbookChapter } from '@/lib/ebook/barber-chapters';

export default function ChapterPage() {
  const params = useParams();
  const chapterSlug = params.chapter as string;
  const [lessonIndex, setLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const chapter = getChapterById(chapterSlug);
  const adjacent = getAdjacentChapters(chapterSlug);

  useEffect(() => {
    if (chapter) {
      setLessonIndex(0);
      setShowQuiz(false);
      setQuizAnswers({});
      setShowResults(false);
    }
  }, [chapter]);

  if (!chapter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
          <Link href="/ebook/barber-theory" className="text-brand-blue-600 hover:underline">
            Back to Chapters
          </Link>
        </div>
      </div>
    );
  }

  const lessons = chapter.lessons || [];
  const currentLesson = lessons[lessonIndex];
  const quizQuestions = chapter.quizQuestions || [];

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quizQuestions.length) * 100);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-slate-900 text-white py-4 px-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/ebook/barber-theory" className="flex items-center gap-2 hover:text-brand-blue-300">
            <ArrowLeft className="w-5 h-5" />
            Back to Chapters
          </Link>
          <div className="text-center">
            <span className="text-sm text-slate-400">Chapter {EBOOK_CHAPTERS.findIndex(c => c.slug === chapterSlug) + 1}</span>
            <h1 className="font-semibold">{chapter.title}</h1>
          </div>
          <div className="w-24" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span>{lessonIndex + 1} / {lessons.length} lessons</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full">
            <div
              className="h-full bg-brand-blue-600 rounded-full transition-all"
              style={{ width: `${((lessonIndex + 1) / lessons.length) * 100}%` }}
            />
          </div>
        </div>

        {!showQuiz ? (
          <>
            {/* Lesson Content */}
            {currentLesson && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <BookOpen className="w-6 h-6 text-brand-blue-600" />
                  <div>
                    <span className="text-sm text-slate-500">Lesson {currentLesson.order}</span>
                    <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
                  </div>
                  {currentLesson.durationMinutes && (
                    <div className="ml-auto flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>{currentLesson.durationMinutes} min</span>
                    </div>
                  )}
                </div>

                {currentLesson.objective && (
                  <div className="bg-brand-blue-50 border-l-4 border-brand-blue-600 p-4 mb-6 rounded-r-lg">
                    <h3 className="font-semibold text-brand-blue-900 mb-1">Learning Objective</h3>
                    <p className="text-brand-blue-800">{currentLesson.objective}</p>
                  </div>
                )}

                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentLesson.content || '' }}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setLessonIndex(Math.max(0, lessonIndex - 1))}
                disabled={lessonIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              {lessonIndex < lessons.length - 1 ? (
                <button
                  onClick={() => setLessonIndex(lessonIndex + 1)}
                  className="flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700"
                >
                  Next Lesson
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : quizQuestions.length > 0 ? (
                <button
                  onClick={() => setShowQuiz(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  Take Chapter Quiz
                  <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href={adjacent?.next ? `/ebook/barber-theory/${adjacent.next}` : '/ebook/barber-theory'}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                >
                  {adjacent?.next ? 'Next Chapter' : 'Back to All Chapters'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </>
        ) : !showResults ? (
          /* Quiz Section */
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold">Chapter Quiz</h2>
            </div>
            <p className="text-slate-600 mb-6">
              Answer all questions to complete this chapter. You need {chapter.passingScore || 70}% to pass.
            </p>

            <div className="space-y-8">
              {quizQuestions.map((question, qIndex) => (
                <div key={question.id} className="border-b border-slate-100 pb-6 last:border-0">
                  <p className="font-semibold mb-4">
                    {qIndex + 1}. {question.question}
                  </p>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          quizAnswers[question.id] === oIndex
                            ? 'bg-brand-blue-50 border border-brand-blue-200'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name={question.id}
                          checked={quizAnswers[question.id] === oIndex}
                          onChange={() => handleAnswerSelect(question.id, oIndex)}
                          className="w-4 h-4 text-brand-blue-600"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setShowQuiz(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Back to Lessons
              </button>
              <button
                onClick={() => setShowResults(true)}
                disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                className="bg-brand-blue-600 text-white px-6 py-2 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        ) : (
          /* Quiz Results */
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            {(() => {
              const score = calculateScore();
              const passed = score >= (chapter.passingScore || 70);
              return (
                <>
                  <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
                    passed ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {passed ? (
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-red-600" />
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    {passed ? 'Congratulations!' : 'Not Quite'}
                  </h2>
                  <p className="text-xl mb-6">
                    You scored <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</span>
                    {passed ? ' - Chapter Complete!' : ` - Need ${chapter.passingScore || 70}% to pass`}
                  </p>

                  {passed && adjacent?.next && (
                    <Link
                      href={`/ebook/barber-theory/${adjacent.next}`}
                      className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg hover:bg-brand-blue-700"
                    >
                      Next Chapter
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
