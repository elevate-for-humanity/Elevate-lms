'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react';

interface SequenceOrderProps {
  title: string;
  description?: string;
  /** Steps in the CORRECT order — component shuffles them */
  steps: { label: string; explanation: string }[];
  onComplete?: (score: number, passed: boolean) => void;
}

/**
 * Tap-to-reorder: students use up/down buttons to put steps in order.
 * Works on phone — no drag needed.
 */
export function SequenceOrder({ title, description, steps, onComplete }: SequenceOrderProps) {
  const [order, setOrder] = useState<number[]>(() => {
    const indices = steps.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });
  const [submitted, setSubmitted] = useState(false);

  function moveUp(pos: number) {
    if (pos === 0 || submitted) return;
    setOrder(prev => {
      const next = [...prev];
      [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
      return next;
    });
  }

  function moveDown(pos: number) {
    if (pos === order.length - 1 || submitted) return;
    setOrder(prev => {
      const next = [...prev];
      [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]];
      return next;
    });
  }

  function handleSubmit() {
    setSubmitted(true);
    const correct = order.filter((stepIdx, pos) => stepIdx === pos).length;
    const score = Math.round((correct / steps.length) * 100);
    onComplete?.(score, score >= 70);
  }

  function handleRetry() {
    const indices = steps.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setOrder(indices);
    setSubmitted(false);
  }

  const correctCount = order.filter((stepIdx, pos) => stepIdx === pos).length;
  const score = Math.round((correctCount / steps.length) * 100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Activity</span>
        <h3 className="text-xl font-bold text-gray-900 mt-2">{title}</h3>
        {description && <p className="text-gray-500 text-sm mt-1">{description}</p>}
        {!submitted && <p className="text-sm text-brand-blue-600 font-medium mt-2">Use the arrows to put the steps in the correct order.</p>}
      </div>

      <div className="space-y-2">
        {order.map((stepIdx, pos) => {
          const step = steps[stepIdx];
          const isCorrect = submitted && stepIdx === pos;
          const isWrong = submitted && stepIdx !== pos;

          return (
            <div key={stepIdx}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                isCorrect ? 'bg-green-50 border-green-400' :
                isWrong ? 'bg-red-50 border-red-300' :
                'bg-white border-gray-200'
              }`}
            >
              {/* Position badge */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                isCorrect ? 'bg-green-500 text-white' :
                isWrong ? 'bg-red-400 text-white' :
                'bg-gray-100 text-gray-600'
              }`}>
                {isCorrect ? <CheckCircle className="w-5 h-5" /> :
                 isWrong ? <XCircle className="w-5 h-5" /> :
                 pos + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-base ${
                  isCorrect ? 'text-green-800' : isWrong ? 'text-red-800' : 'text-gray-900'
                }`}>{step.label}</p>
                {submitted && (
                  <p className={`text-sm mt-0.5 ${isCorrect ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.explanation}
                  </p>
                )}
              </div>

              {/* Move buttons */}
              {!submitted && (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={() => moveUp(pos)} disabled={pos === 0}
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-brand-blue-50 flex items-center justify-center disabled:opacity-20 transition-colors">
                    <ArrowUp className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => moveDown(pos)} disabled={pos === order.length - 1}
                    className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-brand-blue-50 flex items-center justify-center disabled:opacity-20 transition-colors">
                    <ArrowDown className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <div className="flex justify-end mt-4">
          <button onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-brand-blue-600 text-white font-semibold text-sm hover:bg-brand-blue-700 transition-colors">
            Check Order
          </button>
        </div>
      ) : (
        <div className={`mt-4 p-4 rounded-xl ${score >= 70 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-lg font-bold ${score >= 70 ? 'text-green-800' : 'text-red-800'}`}>
                {score === 100 ? 'Perfect!' : score >= 70 ? 'Good job!' : 'Not quite — try again'}
              </p>
              <p className={`text-sm ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                {correctCount}/{steps.length} in the right position ({score}%)
              </p>
            </div>
            {score < 100 && (
              <button onClick={handleRetry} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
