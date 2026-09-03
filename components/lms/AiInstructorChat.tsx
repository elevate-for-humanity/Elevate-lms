'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  isHvac?: boolean;
}

export function AiInstructorChat({ lessonId, courseId, lessonTitle, isHvac }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI instructor for "${lessonTitle}". Ask me anything about this lesson — concepts, practice questions, or how it connects to your program.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // HVAC lessons use the Marcus Johnson persona; all others use the general instructor
      const endpoint = isHvac ? '/api/ai-instructor/hvac' : '/api/ai-instructor';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          lessonId,
          courseId,
          context: lessonTitle,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'AI instructor unavailable. Try again shortly.');
      } else {
        const reply = data.response ?? data.message ?? data.content ?? 'No response received.';
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch {
      setError('Connection error. Check your internet and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div role="tabpanel" aria-label="Ask AI Instructor" className="flex flex-col h-[520px] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="w-8 h-8 rounded-full bg-brand-blue-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {isHvac ? 'Marcus Johnson — HVAC Instructor' : 'AI Instructor'}
          </div>
          <div className="text-xs text-slate-500">Ask anything about this lesson</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'assistant' ? 'bg-brand-blue-100' : 'bg-slate-200'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="w-4 h-4 text-brand-blue-600" />
                : <User className="w-4 h-4 text-slate-600" />}
            </div>
            <div className={`max-w-4/5 px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-slate-100 text-slate-800 rounded-tl-sm'
                : 'bg-brand-blue-600 text-white rounded-tr-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-blue-100 flex items-center justify-center">
              <Bot className="w-4 h-4 text-brand-blue-600" />
            </div>
            <div className="bg-slate-100 px-4 py-2.5 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask a question about this lesson…"
          rows={1}
          className="flex-1 resize-none px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-3 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
