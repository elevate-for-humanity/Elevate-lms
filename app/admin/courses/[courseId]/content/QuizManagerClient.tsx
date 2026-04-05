'use client';

import { useState } from 'react';
import { HelpCircle, Plus, Trash2, ChevronDown, ChevronUp, Loader2, CheckCircle } from 'lucide-react';

interface QuizQuestion {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  points: number;
}

interface Props {
  courseId: string;
  initialQuizTitle: string;
  initialPassingScore: number;
  initialQuestions: QuizQuestion[];
}

const BLANK_QUESTION: QuizQuestion = {
  question_text: '',
  question_type: 'multiple_choice',
  options: ['Option A', 'Option B', 'Option C', 'Option D'],
  correct_answer: 'Option A',
  points: 1,
};

export default function QuizManagerClient({
  courseId,
  initialQuizTitle,
  initialPassingScore,
  initialQuestions,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [quizTitle, setQuizTitle] = useState(initialQuizTitle);
  const [passingScore, setPassingScore] = useState(initialPassingScore);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions.length ? initialQuestions : []
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Question helpers ────────────────────────────────────────────────────────
  const updateQuestion = (qi: number, patch: Partial<QuizQuestion>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const updateOption = (qi: number, oi: number, val: string) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const options = [...q.options];
        const wasCorrect = options[oi] === q.correct_answer;
        options[oi] = val;
        return { ...q, options, correct_answer: wasCorrect ? val : q.correct_answer };
      })
    );

  const addOption = (qi: number) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] } : q
      )
    );

  const removeOption = (qi: number, oi: number) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const options = q.options.filter((_, j) => j !== oi);
        const correct_answer = q.correct_answer === q.options[oi]
          ? (options[0] || '')
          : q.correct_answer;
        return { ...q, options, correct_answer };
      })
    );

  const addQuestion = () =>
    setQuestions((qs) => [...qs, { ...BLANK_QUESTION }]);

  const removeQuestion = (qi: number) =>
    setQuestions((qs) => qs.filter((_, i) => i !== qi));

  const moveQuestion = (qi: number, dir: 'up' | 'down') => {
    const next = dir === 'up' ? qi - 1 : qi + 1;
    if (next < 0 || next >= questions.length) return;
    setQuestions((qs) => {
      const arr = [...qs];
      [arr[qi], arr[next]] = [arr[next], arr[qi]];
      return arr;
    });
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): string | null {
    for (const [qi, q] of questions.entries()) {
      if (!q.question_text.trim()) return `Question ${qi + 1} has no text.`;
      if (q.options.length < 2) return `Question ${qi + 1} needs at least 2 options.`;
      if (!q.correct_answer.trim()) return `Question ${qi + 1} has no correct answer.`;
      if (!q.options.includes(q.correct_answer))
        return `Question ${qi + 1}: correct answer is not in the options list.`;
    }
    return null;
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/quiz`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quiz_title: quizTitle, quiz_passing_score: passingScore, quiz_questions: questions }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || 'Save failed.'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-brand-blue-600" />
          <div>
            <p className="font-semibold text-gray-900">
              {quizTitle || 'Course Assessment'}
            </p>
            <p className="text-sm text-gray-500">
              {questions.length} question{questions.length !== 1 ? 's' : ''} · Pass at {passingScore}%
              {questions.length === 0 && ' · No questions yet'}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t px-6 py-5 space-y-5">
          {/* Quiz settings */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">Quiz title</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Passing score %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                className="w-24 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          </div>

          {/* Questions */}
          {questions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4 border border-dashed rounded-lg">
              No questions yet. Add your first question below.
            </p>
          )}

          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={qi} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                {/* Question header */}
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-gray-500 mt-2 w-6 shrink-0">Q{qi + 1}</span>
                  <textarea
                    value={q.question_text}
                    onChange={(e) => updateQuestion(qi, { question_text: e.target.value })}
                    placeholder="Enter question text"
                    rows={2}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 resize-none"
                  />
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => moveQuestion(qi, 'up')}
                      disabled={qi === 0}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveQuestion(qi, 'down')}
                      disabled={qi === questions.length - 1}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeQuestion(qi)}
                      className="text-gray-300 hover:text-red-400"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Type + points */}
                <div className="flex items-center gap-4 pl-8">
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Type</label>
                    <select
                      value={q.question_type}
                      onChange={(e) => {
                        const type = e.target.value as QuizQuestion['question_type'];
                        if (type === 'true_false') {
                          updateQuestion(qi, {
                            question_type: type,
                            options: ['True', 'False'],
                            correct_answer: 'True',
                          });
                        } else {
                          updateQuestion(qi, { question_type: type });
                        }
                      }}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="multiple_choice">Multiple choice</option>
                      <option value="true_false">True / False</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-0.5">Points</label>
                    <input
                      type="number"
                      min={1}
                      value={q.points}
                      onChange={(e) => updateQuestion(qi, { points: parseInt(e.target.value) || 1 })}
                      className="w-16 border rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                {/* Answer options */}
                <div className="pl-8 space-y-1.5">
                  <p className="text-xs text-gray-500 mb-1">
                    Options — select radio to mark correct answer
                  </p>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qi}`}
                        checked={q.correct_answer === opt}
                        onChange={() => updateQuestion(qi, { correct_answer: opt })}
                        className="h-3.5 w-3.5 text-brand-blue-600 border-gray-300 focus:ring-brand-blue-500 shrink-0"
                        title="Mark as correct"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        className={`flex-1 border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-brand-blue-400 ${
                          q.correct_answer === opt
                            ? 'border-green-400 bg-green-50 text-green-800 font-medium'
                            : 'border-gray-200 bg-white'
                        }`}
                      />
                      {q.question_type === 'multiple_choice' && q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(qi, oi)}
                          className="text-gray-300 hover:text-red-400 shrink-0"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.question_type === 'multiple_choice' && q.options.length < 6 && (
                    <button
                      onClick={() => addOption(qi)}
                      className="text-xs text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" /> Add option
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addQuestion}
            className="flex items-center gap-2 text-sm text-brand-blue-600 hover:text-brand-blue-700 border border-brand-blue-200 rounded-lg px-4 py-2"
          >
            <Plus className="w-4 h-4" /> Add question
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Save */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-blue-600 text-white px-5 py-2 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save quiz'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" /> Saved
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
