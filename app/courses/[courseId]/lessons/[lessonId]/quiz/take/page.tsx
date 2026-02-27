"use client";

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TakeQuizPage({
  params,
}: {
  params: { courseId: string; lessonId: string };
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch quiz questions
    fetch(`/api/quizzes/lesson/${params.lessonId}/questions`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data.questions || []);
        if (data.timeLimit) {
          setTimeRemaining(data.timeLimit * 60); // Convert to seconds
        }
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [params.lessonId]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return undefined;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      if (
        !confirm(
          `You have ${unanswered.length} unanswered questions. Submit anyway?`
        )
      ) {
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/quizzes/lesson/${params.lessonId}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        router.push(
          `/courses/${params.courseId}/lessons/${params.lessonId}/quiz/results/${data.attemptId}`
        );
      } else {
        alert('Failed to submit quiz. Please start again.');
        setSubmitting(false);
      }
    } catch (error) { /* Error handled silently */ 
      alert('Failed to submit quiz. Please start again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative h-48 md:h-64 overflow-hidden">
          <Image
            src="/images/certificates-hero.jpg"
            alt="Quiz Assessment"
            fill
            className="object-cover"
            quality={100}
            priority
            sizes="100vw"
          />

        </section>

        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange-600 mx-auto mb-4" />
          <p className="text-black">Loading quiz...</p>

          {/* Storytelling Section */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-6 text-black">
                      Your Journey Starts Here
                    </h2>
                    <p className="text-lg text-black mb-6 leading-relaxed">
                      Every great career begins with a single step. Whether
                      you're looking to change careers, upgrade your skills, or
                      enter the workforce for the first time, we're here to help
                      you succeed. Our programs are Funded,
                      government-funded, and designed to get you hired fast.
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span className="text-black">
                          Funded training - no tuition, no hidden costs
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span className="text-black">
                          Industry-recognized certifications that employers
                          value
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span className="text-black">
                          Job placement assistance and career support
                        </span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        <span className="text-black">
                          Flexible scheduling for working adults
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/images/artlist/hero-training-7.jpg"
                      alt="Students taking assessment"
                      fill
                      className="object-cover"
                      quality={100}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  Ready to Improve Your Career?
                </h2>
                <p className="text-base md:text-lg mb-8 text-brand-blue-100">
                  Explore training programs and earn industry certifications through
                  Elevate for Humanity.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/contact"
                    className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-50 text-lg shadow-2xl transition-all"
                  >
                    Apply Now
                  </Link>
                  <Link
                    href="/programs"
                    className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-blue-600 border-2 border-white text-lg shadow-2xl transition-all"
                  >
                    Browse All Programs
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Courses", href: "/courses" }, { label: "Take" }]} />
      </div>
<div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 sticky top-4 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">
                Quiz in Progress
              </h1>
              <p className="text-sm text-black mt-1">
                {answeredCount} of {questions.length} questions answered
              </p>
            </div>
            <div className="text-right">
              {timeRemaining !== null && (
                <div
                  className={`text-2xl font-bold ${timeRemaining < 60 ? 'text-brand-orange-600' : 'text-black'}`}
                >
                  {formatTime(timeRemaining)}
                </div>
              )}
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-brand-orange-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-brand-orange-600">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-black mb-4">
                    {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options.map(
                      (option: string, optionIndex: number) => (
                        <button
                          key={optionIndex}
                          onClick={() =>
                            handleAnswerSelect(question.id, optionIndex)
                          }
                          className={`
                          w-full text-left p-4 rounded-lg border-2 transition-all
                          ${
                            answers[question.id] === optionIndex
                              ? 'border-brand-orange-500 bg-brand-orange-50'
                              : 'border-slate-200 hover:border-brand-orange-300 hover:bg-slate-50'
                          }
                        `}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center
                            ${
                              answers[question.id] === optionIndex
                                ? 'border-brand-orange-500 bg-brand-orange-600'
                                : 'border-slate-300'
                            }
                          `}
                            >
                              {answers[question.id] === optionIndex && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span className="text-black">{option}</span>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-black">
                {answeredCount === questions.length
                  ? 'All questions answered!'
                  : `${questions.length - answeredCount} questions remaining`}
              </p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-brand-orange-600 text-white font-semibold rounded-lg hover:bg-brand-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
