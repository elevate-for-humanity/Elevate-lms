'use client';

import React, { useState } from 'react';
import { ChevronRight, Brain } from 'lucide-react';

interface PretestQuestion {
  question: string;
  options: string[];
  answer: number;
  hint: string;
}

interface PretestProps {
  title: string;
  questions: PretestQuestion[];
  onComplete: () => void;
}

/**
 * Pretest shown before the video to activate prior knowledge.
 * Not graded — just primes the student's brain for what's coming.
 * Shows hints after each answer to build curiosity.
 */
export function Pretest({ title, questions, onComplete }: PretestProps) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);

  const q = questions[current];

  function handlePick(idx: number) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-brand-blue-200 bg-brand-blue-50 p-8 text-center">
        <Brain className="w-12 h-12 text-brand-blue-500 mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Learn!</h3>
        <p className="text-gray-600 mb-4">
          You've activated your prior knowledge. Now watch the lesson — pay attention to the topics you weren't sure about.
        </p>
        <button onClick={onComplete}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition-colors">
          Start the Lesson <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Pretest</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">{title}</h3>
          <p className="text-sm text-gray-500">Not graded — just see what you already know.</p>
        </div>
        <span className="text-sm font-semibold text-gray-400">{current + 1}/{questions.length}</span>
      </div>

      <p className="text-base font-semibold text-gray-900 mb-4">{q.question}</p>

      <div className="space-y-2 mb-4">
        {q.options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSel = selected === i;
          const isRight = revealed && i === q.answer;
          const isWrong = revealed && isSel && i !== q.answer;
          return (
            <button key={i} onClick={() => handlePick(i)} disabled={revealed}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                isRight ? 'bg-green-50 border-green-400' :
                isWrong ? 'bg-red-50 border-red-300' :
                isSel && !revealed ? 'bg-brand-blue-50 border-brand-blue-400' :
                'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isRight ? 'bg-green-500 text-white' : isWrong ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-500'
              }`}>{letter}</span>
              <span className="font-medium text-gray-700 text-sm">{opt}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-sm font-medium mb-4">
            {q.hint}
          </div>
          <button onClick={handleNext}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-blue-600 text-white font-semibold hover:bg-brand-blue-700 transition-colors">
            {current < questions.length - 1 ? 'Next Question' : 'Start the Lesson'} <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
