'use client';

import { FormEvent, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export function ContextAwareAdvisor({
  appSlug,
  context,
}: {
  appSlug: 'grants' | 'sam-gov';
  context?: Record<string, string | undefined> | null;
}) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError('');
    setAnswer('');
    try {
      const response = await fetch('/api/apps/context-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appSlug, question: trimmed, context: context || {} }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Advisor request failed.');
      setAnswer(data.answer || 'No response was returned.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Advisor request failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-6">
      <div className="flex items-center gap-2 text-violet-950">
        <Sparkles className="h-5 w-5" />
        <h2 className="font-black">AI workspace advisor</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-violet-900">
        Ask a question about this workspace. Guided setup answers are injected into the model context for this request and are treated as unverified user-provided information.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={appSlug === 'grants' ? 'Example: Which opportunities should I prioritize for this mission?' : 'Example: What should I verify next for this registration goal?'}
          className="w-full rounded-xl border border-violet-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-violet-500"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-black text-white disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Ask advisor
        </button>
      </form>
      {error ? <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      {answer ? <div className="mt-4 whitespace-pre-wrap rounded-xl border border-violet-100 bg-white p-4 text-sm leading-6 text-slate-800">{answer}</div> : null}
    </section>
  );
}

export default ContextAwareAdvisor;
