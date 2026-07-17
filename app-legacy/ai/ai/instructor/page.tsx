'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, AlertCircle, User, Trash2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Auth-gated via middleware — noindex set in app/ai/layout.tsx
export default function AIInstructorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your AI Instructor. I can help you understand course material, answer questions about your program, explain concepts, and guide you through challenging topics. What would you like to learn today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [programId, setProgramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/ai/instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          programId: programId || undefined,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to get a response. Please try again.');
        return;
      }

      const reply = data.response ?? data.message ?? data.content ?? '';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, timestamp: new Date() },
      ]);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    setMessages([
      {
        role: 'assistant',
        content: "Conversation cleared. What would you like to learn?",
        timestamp: new Date(),
      },
    ]);
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col flex-1">
        <Breadcrumbs items={[{ label: 'AI Tools', href: '/ai' }, { label: 'AI Instructor', href: '/ai/instructor' }]} />

        {/* Header */}
        <div className="mt-4 mb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Instructor</h1>
              <p className="text-sm text-slate-500">Ask questions about your course material</p>
            </div>
          </div>
          <button onClick={handleClear} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors mt-1">
            <Trash2 className="w-3.5 h-3.5" />Clear
          </button>
        </div>

        {/* Program context (optional) */}
        <div className="mb-4">
          <input
            type="text"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            placeholder="Program ID (optional — narrows responses to your program)"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600 placeholder:text-slate-400"
          />
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-y-auto p-4 space-y-4 min-h-[320px] max-h-[560px]">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-blue-100' : 'bg-slate-100'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot className="w-4 h-4 text-blue-600" />
                  : <User className="w-4 h-4 text-slate-500" />}
              </div>
              <div className={`max-w-4/5 rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'assistant'
                  ? 'bg-slate-50 border border-slate-100 text-slate-700'
                  : 'bg-blue-600 text-white'
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'assistant' ? 'text-slate-400' : 'text-blue-200'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="mt-3 flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
            rows={2}
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2 text-center">
          AI responses may not be 100% accurate. Verify important information with your instructor.
        </p>
      </div>
    </div>
  );
}
