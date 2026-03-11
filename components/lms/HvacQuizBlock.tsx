'use client'

import { useState } from 'react'
import { QuizQuestion } from '@/lib/courses/hvac-quizzes'

interface Props {
  questions: QuizQuestion[]
}

export default function HvacQuizBlock({ questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [score, setScore] = useState<number | null>(null)

  const answered = Object.keys(answers).length
  const allAnswered = answered === questions.length

  function select(qId: string, optIdx: number) {
    if (score !== null) return // locked after submit
    setAnswers(prev => ({ ...prev, [qId]: optIdx }))
  }

  function submit() {
    const correct = questions.filter(q => answers[q.id] === q.correctAnswer).length
    setScore(correct)
  }

  function reset() {
    setAnswers({})
    setScore(null)
  }

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const selected = answers[q.id]
        const submitted = score !== null
        const isCorrect = selected === q.correctAnswer

        return (
          <div key={q.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <p className="text-white font-semibold mb-4 leading-snug">
              <span className="text-sky-500 font-bold mr-2">{qi + 1}.</span>
              {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi
                const isAnswer   = oi === q.correctAnswer

                let style = 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-sky-500 hover:bg-slate-700 cursor-pointer'
                if (isSelected && !submitted) style = 'border-sky-500 bg-sky-900/40 text-white cursor-pointer'
                if (submitted && isAnswer)    style = 'border-green-500 bg-green-900/30 text-green-200 cursor-default'
                if (submitted && isSelected && !isAnswer) style = 'border-red-500 bg-red-900/30 text-red-200 cursor-default'
                if (submitted && !isSelected && !isAnswer) style = 'border-slate-700 bg-slate-800 text-slate-500 cursor-default'

                return (
                  <button
                    key={oi}
                    onClick={() => select(q.id, oi)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${style}`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      submitted && isAnswer ? 'bg-green-600 text-white' :
                      submitted && isSelected && !isAnswer ? 'bg-red-600 text-white' :
                      isSelected ? 'bg-sky-600 text-white' : 'bg-slate-600 text-slate-300'
                    }`}>
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {submitted && isAnswer && <span className="text-green-400 text-base">✓</span>}
                    {submitted && isSelected && !isAnswer && <span className="text-red-400 text-base">✗</span>}
                  </button>
                )
              })}
            </div>

            {/* Explanation — only shown after submit */}
            {submitted && q.explanation && (
              <div className={`mt-4 px-4 py-3 rounded-xl text-sm ${isCorrect ? 'bg-green-950/50 text-green-200' : 'bg-slate-700 text-slate-300'}`}>
                <span className="font-semibold">{isCorrect ? '✓ Correct. ' : '✗ Incorrect. '}</span>
                {q.explanation}
              </div>
            )}
          </div>
        )
      })}

      {/* Submit / score bar */}
      <div className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4">
        {score === null ? (
          <>
            <span className="text-slate-400 text-sm">{answered} of {questions.length} answered</span>
            <button
              onClick={submit}
              disabled={!allAnswered}
              className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              Submit Answers
            </button>
          </>
        ) : (
          <>
            <div>
              <span className={`text-2xl font-bold ${score === questions.length ? 'text-green-400' : score >= questions.length * 0.7 ? 'text-sky-400' : 'text-amber-400'}`}>
                {score}/{questions.length}
              </span>
              <span className="text-slate-400 text-sm ml-2">
                {score === questions.length ? '— Perfect!' : score >= questions.length * 0.7 ? '— Good work' : '— Review the explanations above'}
              </span>
            </div>
            <button onClick={reset} className="text-slate-400 hover:text-white text-sm underline transition-colors">
              Retake
            </button>
          </>
        )}
      </div>
    </div>
  )
}
