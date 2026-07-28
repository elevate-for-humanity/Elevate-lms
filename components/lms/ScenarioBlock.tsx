'use client';

/**
 * ScenarioBlock
 *
 * Branching "what would you do?" decision tree embedded inside a lesson.
 *
 * Structure:
 *   - A scenario prompt (workplace situation)
 *   - 2–4 choices, each leading to a consequence + optional follow-up branch
 *   - Correct/incorrect feedback with explanation
 *   - "Try again" resets the branch; "Continue" marks the scenario complete
 *
 * Keyboard:
 *   - Arrow Up/Down navigate choices
 *   - Enter/Space selects focused choice
 *   - Escape resets to start
 *
 * ARIA:
 *   - role="group" with aria-labelledby on the scenario
 *   - role="radio" on each choice (single-select)
 *   - aria-live="polite" on feedback region
 *
 * Completion is reported via onComplete(correct: boolean).
 */

import React, { useState, useRef, useCallback, useId } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RotateCcw, ChevronRight } from 'lucide-react';

export interface ScenarioChoice {
  id: string;
  text: string;
  /** Whether this is the best/correct choice */
  correct: boolean;
  /** Feedback shown after selecting this choice */
  feedback: string;
  /** Optional follow-up branch — another scenario that unlocks after this choice */
  branch?: ScenarioNode;
}

export interface ScenarioNode {
  id: string;
  /** The workplace situation */
  prompt: string;
  /** Optional context image alt text */
  contextNote?: string;
  choices: ScenarioChoice[];
}

interface Props {
  scenario: ScenarioNode;
  /** Called when the student reaches a terminal correct choice */
  onComplete?: (correct: boolean) => void;
  /** Whether to show a "Continue" button after completion */
  showContinue?: boolean;
}

type Phase = 'choosing' | 'feedback' | 'branch' | 'done';

export function ScenarioBlock({ scenario, onComplete, showContinue = true }: Props) {
  const [currentNode, setCurrentNode] = useState<ScenarioNode>(scenario);
  const [phase, setPhase] = useState<Phase>('choosing');
  const [selectedChoice, setSelectedChoice] = useState<ScenarioChoice | null>(null);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [history, setHistory] = useState<ScenarioNode[]>([]);
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const promptId = `${uid}-prompt`;
  const feedbackId = `${uid}-feedback`;

  const handleSelect = useCallback((choice: ScenarioChoice, idx: number) => {
    setSelectedChoice(choice);
    setFocusedIdx(idx);
    setPhase('feedback');
    setTimeout(() => feedbackRef.current?.focus(), 50);
  }, []);

  const handleReset = useCallback(() => {
    setCurrentNode(scenario);
    setPhase('choosing');
    setSelectedChoice(null);
    setFocusedIdx(0);
    setHistory([]);
    setTimeout(() => choiceRefs.current[0]?.focus(), 50);
  }, [scenario]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const count = currentNode.choices.length;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (idx + 1) % count;
        setFocusedIdx(next);
        choiceRefs.current[next]?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (idx - 1 + count) % count;
        setFocusedIdx(prev);
        choiceRefs.current[prev]?.focus();
      } else if (e.key === 'Escape') {
        handleReset();
      }
    },
    [currentNode.choices.length, handleReset],
  );

  const handleContinue = useCallback(() => {
    if (!selectedChoice) return;
    if (selectedChoice.branch) {
      setHistory((h) => [...h, currentNode]);
      setCurrentNode(selectedChoice.branch!);
      setPhase('choosing');
      setSelectedChoice(null);
      setFocusedIdx(0);
      setTimeout(() => choiceRefs.current[0]?.focus(), 50);
    } else {
      setPhase('done');
      onComplete?.(selectedChoice.correct);
    }
  }, [selectedChoice, currentNode, onComplete]);

  const isCorrect = selectedChoice?.correct ?? false;
  const hasBranch = !!selectedChoice?.branch;
  const depth = history.length;

  return (
    <div
      className="my-6 rounded-xl border-2 border-brand-blue-100 bg-white overflow-hidden"
      role="group"
      aria-labelledby={promptId}
    >
      {/* Header */}
      <div className="bg-brand-blue-700 px-5 py-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-white/80 shrink-0" aria-hidden />
        <span className="text-xs font-bold text-white/80 uppercase tracking-wide">
          Workplace Scenario{depth > 0 ? ` — Part ${depth + 1}` : ''}
        </span>
      </div>

      <div className="p-5">
        {/* Prompt */}
        <p id={promptId} className="text-sm font-semibold text-slate-900 leading-relaxed mb-5">
          {currentNode.prompt}
        </p>

        {currentNode.contextNote && (
          <p className="text-xs text-slate-500 italic mb-4 border-l-2 border-slate-200 pl-3">
            {currentNode.contextNote}
          </p>
        )}

        {/* Choices */}
        {phase === 'choosing' && (
          <div role="radiogroup" aria-labelledby={promptId} className="space-y-2">
            {currentNode.choices.map((choice, idx) => (
              <button
                key={choice.id}
                ref={(el) => {
                  choiceRefs.current[idx] = el;
                }}
                role="radio"
                aria-checked={focusedIdx === idx}
                tabIndex={focusedIdx === idx ? 0 : -1}
                onClick={() => handleSelect(choice, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-all
                  ${
                    focusedIdx === idx
                      ? 'border-brand-blue-400 bg-brand-blue-50 ring-2 ring-brand-blue-200'
                      : 'border-slate-200 bg-slate-50 hover:border-brand-blue-300 hover:bg-brand-blue-50'
                  }
                  focus:outline-none focus:ring-2 focus:ring-brand-blue-400`}
              >
                <span className="font-semibold text-brand-blue-700 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {choice.text}
              </button>
            ))}
            <p className="text-xs text-slate-400 mt-2">
              Use arrow keys to navigate · Enter or click to select · Esc to reset
            </p>
          </div>
        )}

        {/* Feedback */}
        {phase === 'feedback' && selectedChoice && (
          <div
            ref={feedbackRef}
            id={feedbackId}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            tabIndex={-1}
            className={`rounded-lg border p-4 mb-4 focus:outline-none
              ${isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
          >
            <div className="flex items-start gap-2 mb-2">
              {isCorrect ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
              )}
              <p
                className={`text-sm font-semibold ${isCorrect ? 'text-emerald-800' : 'text-amber-800'}`}
              >
                {isCorrect ? 'Good choice.' : 'Not the best option.'}
              </p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{selectedChoice.feedback}</p>
          </div>
        )}

        {/* Feedback actions */}
        {phase === 'feedback' && (
          <div className="flex items-center gap-3 mt-3">
            {!isCorrect && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                Try again
              </button>
            )}
            {showContinue && (
              <button
                onClick={handleContinue}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-white bg-brand-blue-700 hover:bg-brand-blue-800 rounded-lg px-4 py-1.5 transition focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              >
                {hasBranch ? 'Next situation' : 'Continue'}
                <ChevronRight className="w-3.5 h-3.5" aria-hidden />
              </button>
            )}
          </div>
        )}

        {/* Done state */}
        {phase === 'done' && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3"
          >
            <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />
            Scenario complete — well done.
          </div>
        )}
      </div>
    </div>
  );
}

export default ScenarioBlock;
