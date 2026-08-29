'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  FileCheck,
  GraduationCap,
  Loader2,
  Scissors,
  Send,
  Stethoscope,
  User,
  Wrench,
} from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_PREFIX = 'elevate:paris:conversation:';

interface ParisChatProps {
  onComplete?: (recommendations: string[]) => void;
  showHeader?: boolean;
  className?: string;
  surface?: 'public' | 'learner' | 'store';
  courseTitle?: string | null;
  nextLessonTitle?: string | null;
  courseProgress?: number | null;
  voiceEnabled?: boolean;
}

const PATHWAYS = [
  { id: 'healthcare', label: 'Healthcare', icon: Stethoscope },
  { id: 'trades', label: 'Skilled Trades', icon: Wrench },
  { id: 'beauty', label: 'Barber & Beauty', icon: Scissors },
  { id: 'testing', label: 'Testing & Credentials', icon: FileCheck },
] as const;

const PUBLIC_GREETING: Message = {
  role: 'assistant',
  content: `Hi — I'm PARIS, Elevate's public admissions and career-navigation assistant.

I can help you find the current program, funding, apprenticeship, testing, or application page. Program requirements and funding vary, so I will point you to the specific page that controls the details.

Choose a pathway below or type your question.`,
};

const STORE_GREETING: Message = {
  role: 'assistant',
  content: `Hi — I'm PARIS, your Elevate platform advisor.

I'll ask a few focused questions, recommend the smallest setup that fits, explain useful add-ons, and walk you through the relevant demos. What are you trying to accomplish first?`,
};

function learnerGreeting(courseTitle?: string | null, nextLessonTitle?: string | null): Message {
  return {
    role: 'assistant',
    content: `Hi — I'm PARIS, your Elevate learner guide${courseTitle ? ` for ${courseTitle}` : ''}.

I can guide you through onboarding, the red to-do items on your dashboard, billing setup, required documents, handbook rules, attendance and geofenced timekeeping, RTI coursework, and study help. Your next step is${nextLessonTitle ? `: ${nextLessonTitle}` : ' shown on your dashboard'}. I will support your learning, but I will not approve compliance records or complete graded work for you.`,
  };
}

export default function ParisChat({
  onComplete,
  showHeader = true,
  className = '',
  surface = 'public',
  courseTitle,
  nextLessonTitle,
  courseProgress,
  voiceEnabled = false,
}: ParisChatProps) {
  const learnerSurface = surface === 'learner';
  const storeSurface = surface === 'store';
  const voice = useNaturalVoice();
  const [messages, setMessages] = useState<Message[]>([
    learnerSurface ? learnerGreeting(courseTitle, nextLessonTitle) : storeSurface ? STORE_GREETING : PUBLIC_GREETING,
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(`${STORAGE_PREFIX}${surface}`);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every((item) => item?.role && typeof item?.content === 'string')) {
        setMessages(parsed.slice(-20));
      }
    } catch {
      // Storage availability must never block the assistant.
    }
  }, [surface]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(`${STORAGE_PREFIX}${surface}`, JSON.stringify(messages.slice(-20)));
    } catch {
      // Keep the conversation in component memory when storage is unavailable.
    }
  }, [messages, surface]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendToApi = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const requestMessages = [...messages, userMessage].slice(-20);
    setMessages(requestMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          messages: requestMessages,
          context: {
            surface,
            courseTitle: courseTitle || null,
            nextLessonTitle: nextLessonTitle || null,
            courseProgress: typeof courseProgress === 'number' ? courseProgress : null,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.reply !== 'string') {
        throw new Error('PARIS unavailable');
      }

      setMessages((previous) => [...previous, { role: 'assistant', content: data.reply }]);
      if (storeSurface && voiceEnabled) {
        void voice.play(data.reply, { voice: 'coral', style: 'commercial', rate: 0.96 });
      }
      onComplete?.([]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: learnerSurface
            ? 'I cannot retrieve your course guidance right now. Please continue from your learner dashboard or contact your instructor. I will not guess about your progress or graded work.'
            : storeSurface
              ? 'I cannot reach the live advisor right now. You can still compare current plans at /store/plans or explore the interactive demos at /store/demos.'
              : 'I cannot retrieve a verified answer right now. Please use the Program Directory at https://www.elevateforhumanity.org/programs or contact Admissions at https://www.elevateforhumanity.org/contact.',
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [courseProgress, courseTitle, isLoading, learnerSurface, messages, nextLessonTitle, onComplete, storeSurface, surface, voice, voiceEnabled]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    void sendToApi(input);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendToApi(input);
    }
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {showHeader && (
        <div className="shrink-0 bg-slate-950 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
              <GraduationCap className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{learnerSurface ? 'PARIS Learning Assistant' : storeSurface ? 'PARIS Platform Advisor' : 'PARIS'}</h2>
              <p className="text-sm text-slate-200">{learnerSurface ? courseTitle || 'Course guidance and study support' : storeSurface ? 'Interview, recommendation, demos and answers' : 'Admissions & career navigation'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4 sm:px-6" aria-live="polite">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                message.role === 'user' ? 'bg-brand-blue-700 text-white' : 'bg-slate-950 text-white'
              }`}
            >
              {message.role === 'user' ? <User className="h-4 w-4" aria-hidden="true" /> : <Bot className="h-4 w-4" aria-hidden="true" />}
            </div>
            <div
              className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'rounded-tr-sm bg-brand-blue-700 text-white'
                  : 'rounded-tl-sm border border-slate-200 bg-white text-slate-900 shadow-sm'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-white">
              <Bot className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span className="text-sm">Checking the current guidance…</span>
              </div>
            </div>
          </div>
        )}

        {!isLoading && messages.length === 1 && learnerSurface && (
          <div className="grid gap-2">
            {[
              nextLessonTitle ? `What should I know before I start ${nextLessonTitle}?` : 'What should I do next in my course?',
              'Help me make a study plan from my current progress.',
              'Explain a course concept without giving me graded answers.',
            ].map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => void sendToApi(prompt)}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-700"
              >
                <GraduationCap className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{prompt}</span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 1 && storeSurface && (
          <div className="grid gap-2">
            {[
              'Interview me and recommend the best Elevate setup.',
              'I need a website and more customers. What should I start with?',
              'Walk me through the platform and explain useful add-ons.',
            ].map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => void sendToApi(prompt)}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-cyan-200 bg-white px-4 py-3 text-left font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-50"
              >
                <Bot className="h-5 w-5 shrink-0 text-cyan-700" aria-hidden="true" />
                <span>{prompt}</span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 1 && !learnerSurface && !storeSurface && (
          <div className="grid gap-2 sm:grid-cols-2">
            {PATHWAYS.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => void sendToApi(`I'm interested in ${label}. Show me the current options and the page I should review.`)}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-700"
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{label}</span>
                <ArrowRight className="ml-auto h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
        <label htmlFor="paris-chat-input" className="sr-only">Ask PARIS a question</label>
        <div className="flex items-end gap-3">
          <textarea
            id="paris-chat-input"
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 2000))}
            onKeyDown={handleKeyDown}
            placeholder={learnerSurface ? 'Ask about your course or next lesson…' : storeSurface ? 'Tell PARIS about your business or ask a platform question…' : 'Ask about a program, funding, testing, or apprenticeship…'}
            className="min-h-[52px] max-h-40 flex-1 resize-none rounded-2xl border-2 border-slate-300 px-4 py-3 text-sm text-slate-950 focus:border-brand-blue-700 focus:outline-none focus:ring-2 focus:ring-brand-blue-200"
            rows={2}
            disabled={isLoading}
            maxLength={2000}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || isLoading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brand-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-brand-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
