'use client';

import { FormEvent, useState } from 'react';
import { Bot, Loader2, MessageCircle, X } from 'lucide-react';

export default function CourseTutor({ courseId, lessonId }: { courseId: string; lessonId?: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, lessonId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Tutor request failed (HTTP ${res.status})`);
      setAnswer(String(body.answer ?? ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tutor unavailable');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <section className="mb-3 w-[min(92vw,420px)] rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="Course AI tutor">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-700" />
              <div>
                <p className="font-extrabold text-slate-950">Course Tutor</p>
                <p className="text-xs font-semibold text-slate-500">Grounded in this course. Cannot change grades.</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close course tutor"><X className="h-4 w-4" /></button>
          </header>
          <div className="max-h-72 overflow-y-auto px-4 py-4">
            {answer ? <div className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-800">{answer}</div> : <p className="text-sm font-medium text-slate-600">Ask for another explanation, an example, or help reviewing a missed objective. For active assessments, the tutor teaches the concept instead of revealing answer keys.</p>}
            {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
          </div>
          <form onSubmit={submit} className="border-t border-slate-200 p-3">
            <label className="sr-only" htmlFor="course-tutor-question">Ask the course tutor</label>
            <textarea id="course-tutor-question" value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} maxLength={2000} placeholder="Ask about this lesson…" className="w-full resize-none rounded-xl border border-slate-300 p-3 text-sm text-slate-950 outline-none focus:border-cyan-600" />
            <button disabled={loading || !question.trim()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 font-bold text-white disabled:opacity-40">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              {loading ? 'Thinking…' : 'Ask tutor'}
            </button>
          </form>
        </section>
      ) : null}
      <button type="button" onClick={() => setOpen((value) => !value)} className="ml-auto flex items-center gap-2 rounded-full bg-cyan-700 px-4 py-3 font-bold text-white shadow-xl hover:bg-cyan-800" aria-expanded={open} aria-label="Open course AI tutor">
        <MessageCircle className="h-5 w-5" /> Ask Tutor
      </button>
    </div>
  );
}
