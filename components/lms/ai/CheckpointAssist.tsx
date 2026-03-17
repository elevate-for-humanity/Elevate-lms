'use client';

import { useState } from 'react';
import { Lightbulb, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  className?: string;
}

export function CheckpointAssist({
  question,
  userAnswer,
  correctAnswer,
  explanation,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchFeedback() {
    if (feedback) {
      setOpen((v) => !v);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/lms/ai/explain-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, userAnswer, correctAnswer, explanation }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setFeedback(data.feedback);
    } catch {
      setError('Could not load explanation. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`mt-3 ${className}`}>
      <button
        onClick={fetchFeedback}
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        Why was I wrong?
        {feedback && (open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
          {loading && (
            <div className="flex items-center gap-2 text-amber-700 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing your answer…
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {feedback && !loading && (
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{feedback}</p>
          )}
        </div>
      )}
    </div>
  );
}
