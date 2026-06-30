'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Bot, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type Message = { role: 'user' | 'assistant'; content: string };

export default function OperatorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'I am your AI Operator. Ask me to create a landing page, improve SEO, draft enrollment copy, or plan a course module.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: prompt }]);
    setLoading(true);
    try {
      const res = await fetch('/api/operator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: 'assistant', content: data.error ?? 'Please log in to use the operator.' },
        ]);
        return;
      }
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Network error. Try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-10">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'AI Operator', href: '/operator' },
          ]}
        />

        <div className="mt-4 flex items-center gap-2">
          <Bot className="h-6 w-6 text-brand-red-600" />
          <h1 className="text-2xl font-bold text-slate-900">AI Operator</h1>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Customer-facing operator — not Dev Studio.{' '}
          <Link href="/login?redirect=/operator" className="text-brand-red-600 underline">
            Log in
          </Link>{' '}
          to run actions on your workspace.
        </p>

        <div className="mt-6 flex-1 space-y-4 rounded-xl border border-slate-200 bg-white p-4 min-h-[360px]">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-4 py-3 text-sm ${
                m.role === 'user' ? 'ml-8 bg-brand-red-50 text-slate-900' : 'mr-8 bg-slate-100 text-slate-800'
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Create a landing page for our CNA program…"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-red-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            Send <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          Hire specialized agents from the{' '}
          <Link href="/store/ai-team" className="underline">
            AI Team marketplace
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
