'use client';

/**
 * Marcus Johnson — HVAC AI Instructor panel.
 *
 * Embedded in every HVAC lesson. Marcus knows the lesson content,
 * key terms, quiz questions, and service scenarios. He teaches,
 * quizzes, and guides the student through the material conversationally.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  lessonNumber: number;
  lessonTitle: string;
}

const QUICK_PROMPTS = [
  "I don't understand this — explain it differently",
  "Quiz me on this lesson",
  "Walk me through a service call scenario",
  "What will the EPA 608 exam ask about this?",
  "What are the most common mistakes on this?",
];

export default function MarcusInstructor({ lessonNumber, lessonTitle }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load opening message when panel first opens
  useEffect(() => {
    if (!opened || messages.length > 0) return;
    fetchReply([], true);
  }, [opened]);

  const fetchReply = async (history: Message[], isOpening = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-instructor/hvac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          lessonNumber,
          lessonTitle,
          isOpening,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "I'm having trouble connecting. Check your internet and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const send = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMessage: Message = { role: 'user', content: msg };
    const updated = [...messages, userMessage];
    setMessages(updated);

    await fetchReply(updated);
    inputRef.current?.focus();
  };

  const reset = () => {
    setMessages([]);
    fetchReply([], true);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── Closed state — just a button ──────────────────────────────────────
  if (!opened) {
    return (
      <div className="mt-8 border-t border-slate-200 pt-6">
        <button
          onClick={() => setOpened(true)}
          className="w-full flex items-center gap-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-5 py-4 transition group"
        >
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
              <Image
                src="/images/team/instructors/instructor-trades.jpg"
                alt="Marcus Johnson"
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-brand-green-400 rounded-full border-2 border-slate-900" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-sm">Ask Marcus</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Your HVAC instructor — ask anything about this lesson
            </p>
          </div>
          <div className="bg-white/10 group-hover:bg-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold transition">
            Open
          </div>
        </button>
      </div>
    );
  }

  // ── Open state ────────────────────────────────────────────────────────
  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200">
            <Image
              src="/images/team/instructors/instructor-trades.jpg"
              alt="Marcus Johnson"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-green-400 rounded-full border-2 border-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 text-sm">Marcus Johnson</p>
          <p className="text-xs text-slate-500">HVAC Instructor · Lesson {lessonNumber}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            title="Start over"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Message thread */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && loading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Marcus is getting ready...
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {msg.role === 'assistant' ? (
                    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      <Image
                        src="/images/team/instructors/instructor-trades.jpg"
                        alt="Marcus"
                        width={28}
                        height={28}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">You</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'assistant'
                        ? 'bg-white border border-slate-200 text-slate-800'
                        : 'bg-brand-blue-600 text-white'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && messages.length > 0 && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src="/images/team/instructors/instructor-trades.jpg"
                      alt="Marcus"
                      width={28}
                      height={28}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 2 && !loading && (
              <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-xs bg-white border border-slate-200 hover:border-brand-blue-300 hover:bg-brand-blue-50 text-slate-700 hover:text-brand-blue-700 px-3 py-1.5 rounded-full transition"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-200 p-3 flex gap-2 items-end bg-white">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Marcus anything about this lesson..."
                rows={1}
                className="flex-1 resize-none text-sm text-slate-900 placeholder-slate-400 border-0 outline-none bg-transparent leading-relaxed max-h-32 overflow-y-auto"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
