'use client';

/**
 * LessonAssessmentEditor
 * Edits: quiz_questions (add/edit/remove), passing_score.
 * Used for quiz, checkpoint, final_exam lesson types.
 */

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export interface QuizQuestion {
  id:            string;
  question:      string;
  options:       [string, string, string, string];
  correctAnswer: number; // 0-based
  explanation:   string;
}

interface Props {
  questions:    QuizQuestion[];
  passingScore: number;
  onChange:     (questions: QuizQuestion[]) => void;
  onScoreChange: (score: number) => void;
}

function emptyQuestion(): QuizQuestion {
  return {
    id:            crypto.randomUUID(),
    question:      '',
    options:       ['', '', '', ''],
    correctAnswer: 0,
    explanation:   '',
  };
}

export default function LessonAssessmentEditor({ questions, passingScore, onChange, onScoreChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const add = () => {
    const q = emptyQuestion();
    onChange([...questions, q]);
    setExpandedId(q.id);
  };

  const remove = (id: string) => onChange(questions.filter(q => q.id !== id));

  const update = (id: string, patch: Partial<QuizQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  const updateOption = (id: string, optIdx: number, val: string) => {
    const q = questions.find(q => q.id === id);
    if (!q) return;
    const options = [...q.options] as [string, string, string, string];
    options[optIdx] = val;
    update(id, { options });
  };

  return (
    <div className="space-y-4">
      {/* Passing score */}
      <div className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div>
          <label className="block text-xs font-semibold text-amber-800 mb-1">
            Passing Score (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={passingScore}
            onChange={e => onScoreChange(Math.min(100, Math.max(1, parseInt(e.target.value) || 70)))}
            className="w-24 border border-amber-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
        <p className="text-xs text-amber-700 flex-1">
          Learner must score at least {passingScore}% to pass this assessment. Required for publish.
        </p>
      </div>

      {/* Question count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {questions.length} question{questions.length !== 1 ? 's' : ''} — minimum 1 required for publish.
        </p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700 px-2 py-1 rounded border border-brand-blue-200 hover:bg-brand-blue-50"
        >
          <Plus className="w-3 h-3" /> Add Question
        </button>
      </div>

      {questions.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-sm text-slate-400">No questions yet. Add at least one.</p>
        </div>
      )}

      <div className="space-y-2">
        {questions.map((q, qi) => {
          const isOpen = expandedId === q.id;
          return (
            <div key={q.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 cursor-pointer hover:bg-slate-100"
                onClick={() => setExpandedId(isOpen ? null : q.id)}
              >
                <span className="text-xs font-mono text-slate-400 w-6">Q{qi + 1}</span>
                <span className="flex-1 text-sm text-slate-700 truncate">
                  {q.question || <span className="text-slate-400 italic">Untitled question</span>}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                  q.options.every(o => o.trim()) && q.question.trim()
                    ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {q.options.every(o => o.trim()) && q.question.trim() ? 'Complete' : 'Incomplete'}
                </span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); remove(q.id); }}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>

              {/* Body */}
              {isOpen && (
                <div className="p-4 space-y-3 border-t border-slate-100">
                  {/* Question text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Question Text *</label>
                    <textarea
                      value={q.question}
                      onChange={e => update(q.id, { question: e.target.value })}
                      rows={2}
                      placeholder="Enter the question..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Answer Options * <span className="text-slate-400 font-normal">(select the correct one)</span>
                    </label>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswer === oi}
                            onChange={() => update(q.id, { correctAnswer: oi })}
                            className="accent-brand-green-600 flex-shrink-0"
                            title="Mark as correct answer"
                          />
                          <span className="text-xs font-mono text-slate-400 w-4">{String.fromCharCode(65 + oi)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={e => updateOption(q.id, oi, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                            className={`flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 ${
                              q.correctAnswer === oi
                                ? 'border-brand-green-300 bg-brand-green-50'
                                : 'border-slate-200'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Explanation <span className="text-slate-400 font-normal">(shown after answer)</span>
                    </label>
                    <textarea
                      value={q.explanation}
                      onChange={e => update(q.id, { explanation: e.target.value })}
                      rows={2}
                      placeholder="Explain why the correct answer is correct..."
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
