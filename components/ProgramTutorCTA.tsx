'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProgramTutorCTAProps {
  programSlug: string;
  programName: string;
  applyHref: string;
  /** Suggested prompt chips shown before first user message */
  suggestions?: string[];
  /** Override button styling */
  buttonClassName?: string;
}

const DEFAULT_SUGGESTIONS = [
  'What credentials will I earn?',
  'How long is the program?',
  'Is funding available?',
  'What jobs can I get?',
];

export function ProgramTutorCTA({
  programSlug,
  programName,
  applyHref,
  suggestions = DEFAULT_SUGGESTIONS,
  buttonClassName,
}: ProgramTutorCTAProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm the AI Tutor for the ${programName} program. Ask me about credentials, schedule, funding options, or career outcomes.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Escape to close + focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'Tab' && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, handleKeyDown]);

  async function handleSend(text?: string) {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-tutor/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programSlug, message: trimmed }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <>
      {/* CTA Buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={buttonClassName ?? 'inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/90'}
        >
          <MessageCircle className="w-4 h-4" />
          Ask the AI Tutor
        </button>
        <Link
          href={applyHref}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Apply Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Chat Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={`${programName} AI Tutor`}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 flex flex-col"
            style={{ maxHeight: '80vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-brand-blue-400" />
                  <span className="text-sm font-semibold text-white">{programName} AI Tutor</span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">Program info only. For eligibility decisions, submit an application.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-blue-600 text-white'
                      : 'bg-white/5 border border-white/10 text-white/90'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/50">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {showSuggestions && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {suggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-xs bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 rounded-full px-3 py-1.5 transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/10 p-3 shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask about ${programName}...`}
                  maxLength={500}
                  aria-label="Type your question"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-brand-blue-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg px-3 py-2 transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-xs text-white/30">
                  AI can make mistakes. For enrollment decisions, contact admissions.
                </p>
                <Link
                  href={applyHref}
                  className="text-xs text-brand-blue-400 hover:text-brand-blue-300 font-medium whitespace-nowrap ml-2"
                >
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
