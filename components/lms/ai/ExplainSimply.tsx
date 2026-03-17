'use client';

import { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';

interface Props {
  content: string;
}

export function ExplainSimply({ content }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [simplified, setSimplified] = useState('');
  const [showSimplified, setShowSimplified] = useState(false);

  async function handleExplain() {
    if (simplified) {
      // Already fetched — just toggle
      setShowSimplified(true);
      return;
    }
    setState('loading');
    try {
      const res = await fetch('/api/lms/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setSimplified(data.simplified);
      setState('done');
      setShowSimplified(true);
    } catch {
      setState('error');
    }
  }

  return (
    <div className="mt-4">
      {/* Trigger button */}
      {!showSimplified && (
        <button
          onClick={handleExplain}
          disabled={state === 'loading'}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-blue-200 bg-brand-blue-50 px-3 py-1.5 text-sm font-medium text-brand-blue-700 hover:bg-brand-blue-100 transition-colors disabled:opacity-60"
        >
          {state === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {state === 'loading' ? 'Simplifying…' : 'Explain in simple terms'}
        </button>
      )}

      {/* Error */}
      {state === 'error' && (
        <p className="mt-2 text-sm text-red-600">
          Could not simplify right now. Try again.
        </p>
      )}

      {/* Simplified output */}
      {showSimplified && simplified && (
        <div className="mt-3 rounded-lg border border-brand-blue-200 bg-brand-blue-50 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue-600 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Simplified version
            </div>
            <button
              onClick={() => setShowSimplified(false)}
              aria-label="Close simplified view"
              className="text-brand-blue-400 hover:text-brand-blue-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {simplified}
          </p>
          <button
            onClick={() => setShowSimplified(false)}
            className="mt-3 text-xs text-brand-blue-500 hover:underline"
          >
            Show original
          </button>
        </div>
      )}
    </div>
  );
}
