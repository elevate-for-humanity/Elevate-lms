'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import type { ModuleDef } from '@/courses/hvac/modules'

const HVACLab = dynamic(() => import('@/components/HVACLab'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
      Loading 3D equipment lab...
    </div>
  ),
})

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface ModulePageProps {
  module: ModuleDef
  quiz: QuizQuestion[]
  totalModules: number
  showLab?: boolean
  onComplete?: () => void
}

function SectionHeader({ id, number, title }: { id: string; number: number; title: string }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-4 scroll-mt-32">
      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-blue-600 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </span>
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'video', label: 'Video' },
  { id: 'content', label: 'Content' },
  { id: 'quiz', label: 'Quiz' },
]

export default function ModulePage({ module, quiz, totalModules, showLab = false, onComplete }: ModulePageProps) {
  const [labComplete, setLabComplete] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [moduleComplete, setModuleComplete] = useState(false)

  const quizScore = quiz.filter((q, i) => quizAnswers[i] === q.answer).length
  const quizPassed = quizScore >= Math.ceil(quiz.length * 0.7)

  const handleSubmitQuiz = async () => {
    setQuizSubmitted(true)
    if (quizPassed) {
      setModuleComplete(true)
      onComplete?.()
      try {
        await fetch(`/api/lessons/hvac-module${module.number}-lesson1/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quizScore, labComplete, videoWatched: true }),
        })
      } catch {
        // best-effort
      }
    }
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const navItems = showLab
    ? [{ id: 'video', label: 'Video' }, { id: 'content', label: 'Content' }, { id: 'lab', label: '3D Lab' }, { id: 'quiz', label: 'Quiz' }]
    : NAV_ITEMS

  return (
    <div className="min-h-screen bg-white">
      {/* Module header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="text-sm font-medium text-brand-blue-400 mb-2">
            Module {module.number} of {totalModules}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">{module.title}</h1>
          <p className="mt-1 text-slate-400 text-sm">{module.subtitle}</p>
          <p className="mt-3 text-slate-300 text-lg max-w-2xl">{module.description}</p>
        </div>
      </div>

      {/* Sticky nav */}
      <nav className="sticky top-[70px] z-30 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navItems.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-brand-blue-50 hover:text-brand-blue-700 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Video */}
      <div id="video" className="max-w-4xl mx-auto px-4 pt-10 scroll-mt-32">
        <div className="overflow-hidden rounded-2xl border bg-black shadow-sm">
          <video controls preload="metadata" className="aspect-video w-full" src={module.videoUrl} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-16">
        {/* Content sections */}
        <section>
          <SectionHeader id="content" number={1} title="Lesson Content" />
          <div className="space-y-4">
            {module.sections.map((sec) => (
              <details key={sec.title} className="rounded-xl border bg-white shadow-sm overflow-hidden group">
                <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{sec.title}</h3>
                  <svg className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-700 leading-relaxed">{sec.content}</p>
                  {sec.inspect && (
                    <div className="mt-3 rounded-lg bg-slate-50 border px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        How technicians inspect it
                      </div>
                      <p className="text-sm text-slate-700">{sec.inspect}</p>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Inspection steps (if present) */}
        {module.inspectionSteps && (
          <section>
            <SectionHeader id="inspection" number={2} title="Inspection Walkthrough" />
            <div className="space-y-4">
              {module.inspectionSteps.map((item, idx) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-blue-100 text-brand-blue-700 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 rounded-xl border bg-white shadow-sm px-5 py-4">
                    <h4 className="font-bold text-slate-900">{item.step}</h4>
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3D Lab (Module 1 only) */}
        {showLab && (
          <section>
            <SectionHeader id="lab" number={module.inspectionSteps ? 3 : 2} title="Interactive 3D Equipment Lab" />
            <p className="text-slate-600 mb-4">
              Click directly on any part of the condenser unit to identify it. Drag to rotate, scroll to zoom.
            </p>
            <HVACLab onAllIdentified={() => setLabComplete(true)} />
            {labComplete && (
              <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium text-center">
                All components identified.
              </div>
            )}
          </section>
        )}

        {/* Jump to quiz */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => scrollTo('quiz')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold transition"
          >
            Take the Quiz
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        {/* Quiz */}
        <section>
          <SectionHeader id="quiz" number={showLab ? 4 : (module.inspectionSteps ? 3 : 2)} title="Knowledge Check" />
          <p className="text-slate-600 mb-6">
            Answer all {quiz.length} questions. You need at least {Math.ceil(quiz.length * 0.7)} correct to pass.
          </p>
          <div className="space-y-6">
            {quiz.map((q, qIdx) => {
              const selected = quizAnswers[qIdx]
              const isCorrect = selected === q.answer
              const showResult = quizSubmitted
              return (
                <div
                  key={qIdx}
                  className={`rounded-xl border shadow-sm overflow-hidden ${
                    showResult ? (isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'bg-white'
                  }`}
                >
                  <div className="px-5 py-4">
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                        {qIdx + 1}
                      </span>
                      <p className="font-semibold text-slate-900 pt-0.5">{q.question}</p>
                    </div>
                    <div className="mt-3 ml-10 space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selected === opt
                        const isAnswer = q.answer === opt
                        let optClass = 'border-slate-200 bg-white hover:bg-slate-50'
                        if (isSelected && !showResult) optClass = 'border-brand-blue-500 bg-brand-blue-50'
                        if (showResult && isAnswer) optClass = 'border-green-500 bg-green-50'
                        if (showResult && isSelected && !isAnswer) optClass = 'border-red-400 bg-red-50'
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: opt }))}
                            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition ${optClass} ${
                              quizSubmitted ? 'cursor-default' : 'cursor-pointer'
                            }`}
                          >
                            <span className="font-medium text-slate-500 mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="text-slate-800">{opt}</span>
                            {showResult && isAnswer && (
                              <span className="ml-2 text-green-600 font-semibold">&#10003; Correct</span>
                            )}
                            {showResult && isSelected && !isAnswer && (
                              <span className="ml-2 text-red-600 font-semibold">&#10007;</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {!quizSubmitted && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < quiz.length}
                className="w-full py-3 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition text-lg"
              >
                {Object.keys(quizAnswers).length < quiz.length
                  ? `Answer all questions (${Object.keys(quizAnswers).length}/${quiz.length})`
                  : 'Submit Answers'}
              </button>
            </div>
          )}

          {quizSubmitted && (
            <div className={`mt-6 rounded-xl border-2 p-5 text-center ${quizPassed ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
              <div className="text-3xl mb-2">{quizPassed ? '\u2713' : '\u2717'}</div>
              <div className={`font-bold text-lg ${quizPassed ? 'text-green-800' : 'text-red-800'}`}>
                {quizPassed ? 'Quiz Passed!' : 'Quiz Not Passed'}
              </div>
              <p className={`text-sm mt-1 ${quizPassed ? 'text-green-700' : 'text-red-700'}`}>
                You scored {quizScore} out of {quiz.length}.
                {quizPassed ? '' : ` You need at least ${Math.ceil(quiz.length * 0.7)} correct. Review and try again.`}
              </p>
              {!quizPassed && (
                <button
                  type="button"
                  onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); scrollTo('quiz'); }}
                  className="mt-4 px-6 py-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold transition"
                >
                  Retry Quiz
                </button>
              )}
            </div>
          )}
        </section>

        {/* Module complete */}
        {moduleComplete && (
          <section id="complete" className="scroll-mt-32">
            <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-8 text-center">
              <div className="text-4xl mb-3">&#10003;</div>
              <h2 className="text-2xl font-bold text-green-800">Module {module.number} Complete</h2>
              <p className="text-green-700 mt-2">
                You scored {quizScore}/{quiz.length}.
                {module.number < totalModules
                  ? ` Continue to Module ${module.number + 1}.`
                  : ' Proceed to the Final Exam.'}
              </p>
              {module.number < totalModules ? (
                <a
                  href={`/preview/hvac-module-${module.number + 1}`}
                  className="mt-4 inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition"
                >
                  Next Module →
                </a>
              ) : (
                <a
                  href="/lms/courses"
                  className="mt-4 inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition"
                >
                  Take Final Exam →
                </a>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
