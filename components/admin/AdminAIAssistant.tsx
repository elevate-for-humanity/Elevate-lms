'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, X, Minimize2, Maximize2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ts?: string;
}

const QUICK_PROMPTS = [
  'How many applications are pending?',
  'What is revenue this month?',
  'Show inactive learners',
  'Which programs are unpublished?',
  'How many active enrollments?',
  "Summarize today's operations",
];

export function AdminAIAssistant() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi — I'm your admin operations assistant.\n\nAsk me anything about live data: applications, enrollments, revenue, students, programs, compliance. I can also help you navigate to the right page.",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, ts: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: next.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? 'No response.',
        ts: new Date().toISOString(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Could not reach the assistant. Check your connection.',
        ts: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function fmtTime(iso?: string) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-lg hover:bg-slate-700 transition-all hover:scale-105"
        aria-label="Open admin assistant"
      >
        <Bot className="w-4 h-4" />
        <span className="text-sm font-semibold hidden sm:inline">Admin Assistant</span>
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
      </button>
    );
  }

  return (
    <div className={`fixed z-40 flex flex-col bg-white shadow-2xl transition-all duration-200
      ${minimized
        ? 'bottom-20 right-4 lg:bottom-6 lg:right-6 h-14 w-72 rounded-2xl border border-slate-200'
        : 'bottom-0 right-0 left-0 h-[70vh] rounded-t-2xl border-t border-slate-200 sm:bottom-20 sm:right-4 sm:left-auto sm:h-[600px] sm:w-96 sm:max-h-[85vh] sm:rounded-2xl sm:border lg:bottom-6 lg:right-6'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-t-2xl flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-none">Admin Assistant</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Live data · Operations</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(m => !m)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Quick prompts */}
          <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap gap-1.5 flex-shrink-0">
            {QUICK_PROMPTS.map(p => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={loading}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-slate-900 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
                {m.ts && (
                  <span className="text-[9px] text-slate-300 mt-1 px-1">{fmtTime(m.ts)}</span>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-start">
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />
                  <span className="text-[10px] text-slate-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 px-3 py-3 flex items-end gap-2 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about applications, revenue, students… (Enter to send)"
              disabled={loading}
              rows={2}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 resize-none leading-relaxed"
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40 transition-colors flex-shrink-0 mb-0.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
