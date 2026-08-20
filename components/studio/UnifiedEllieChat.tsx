'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bot,
  Loader2,
  PanelRightOpen,
  Rocket,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import {
  ELLIE_ROUTE_LABEL,
  fetchAiHealth,
  routeEllieMessage,
  sendOpsMessage,
  streamExecuteCommand,
  streamPlatformChat,
  type EllieMessageRoute,
} from '@/lib/devstudio/ellie-unified-handlers';

interface EllieAction {
  id: string;
  type: string;
  label: string;
  params: Record<string, unknown>;
  targetCount: number;
  dangerLevel: 'low' | 'medium' | 'high';
  description: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  route?: EllieMessageRoute;
  action?: EllieAction | null;
}

interface UnifiedEllieChatProps {
  onOpenDeploy?: () => void;
  onOpenPreview?: () => void;
  embedded?: boolean;
  fileContext?: string;
}

const QUICK = [
  {
    label: 'Build a course',
    text: 'Build a complete workforce course from my instructions, including modules, lessons, assessments, objectives, and completion rules. Show me the draft before saving.',
  },
  {
    label: 'Review applications',
    text: 'Show me the applications that need attention, explain why they are pending, and tell me the next action for each one.',
  },
  {
    label: 'Publish website',
    text: 'Check the website publishing state and tell me what is blocking a safe production publish. Fix what you can through available tools.',
  },
  {
    label: 'Program audit',
    text: 'Audit my active programs for missing course content, credentials, documents, or configuration and prioritize the gaps.',
  },
  {
    label: 'System health',
    text: 'Run a platform health check across Admin, LMS, database, and deployment dependencies and explain any degraded service.',
  },
  {
    label: 'Fix deployment',
    text: 'Inspect the latest Admin deployment failure, identify the root cause, and use the available safe tools to correct it.',
  },
];

export default function UnifiedEllieChat({
  onOpenDeploy,
  onOpenPreview,
  embedded = false,
  fileContext,
}: UnifiedEllieChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState('checking…');
  const [aiOk, setAiOk] = useState(true);
  const [lastRoute, setLastRoute] = useState<EllieMessageRoute | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchAiHealth().then(({ ok, label }) => {
      setAiOk(ok);
      setHealth(label);
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    const route = routeEllieMessage(text);
    setLastRoute(route);
    const userMsg: ChatMessage = { role: 'user', content: text, route };
    setMessages((prev) => [...prev, userMsg]);
    const assistantIdx = messages.length + 1;

    try {
      if (route === 'command') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `▶ ${ELLIE_ROUTE_LABEL.command}\n`, provider: 'execute', route },
        ]);
        await streamExecuteCommand(text, (line) => {
          setMessages((prev) => {
            const next = [...prev];
            const row = next[assistantIdx];
            if (row?.role === 'assistant') next[assistantIdx] = { ...row, content: row.content + line };
            return next;
          });
        });
      } else if (route === 'ops') {
        const { reply, action } = await sendOpsMessage(
          text,
          messages.map((message) => ({ role: message.role, content: message.content })),
        );
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: reply,
            provider: 'admin-ai',
            route,
            action: (action as EllieAction) ?? null,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: '', provider: 'admin-ai', route }]);
        const history = [...messages, userMsg].map((message) => ({ role: message.role, content: message.content }));
        await streamPlatformChat(history, {
          fileContext,
          onToken: (token) => {
            setMessages((prev) => {
              const next = [...prev];
              const row = next[assistantIdx];
              if (row?.role === 'assistant') next[assistantIdx] = { ...row, content: row.content + token };
              return next;
            });
          },
          onDone: (meta) => {
            setMessages((prev) => {
              const next = [...prev];
              const row = next[assistantIdx];
              if (row?.role === 'assistant') {
                next[assistantIdx] = { ...row, provider: meta.provider ?? row.provider };
              }
              return next;
            });
          },
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const shellClass = embedded ? 'bg-white text-gray-950' : 'bg-gray-950 text-gray-100';
  const headerClass = embedded ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900';
  const assistantClass = embedded
    ? 'border border-gray-200 bg-gray-50 text-gray-900'
    : 'border border-gray-800 bg-gray-900 text-gray-100';
  const mutedTextClass = embedded ? 'text-gray-500' : 'text-gray-400';
  const inputAreaClass = embedded ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900';
  const inputClass = embedded
    ? 'border-gray-300 bg-white text-gray-950 placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200'
    : 'border-gray-700 bg-gray-950 text-white placeholder:text-gray-500 focus:border-blue-500';

  return (
    <div className={`flex h-full min-h-0 flex-col ${shellClass}`}>
      {!embedded && (
        <div className={`flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3 ${headerClass}`}>
          <Sparkles className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Admin AI</p>
            <p className={`truncate text-[11px] ${mutedTextClass}`}>
              Platform tools · {health}
              {lastRoute ? ` · last: ${ELLIE_ROUTE_LABEL[lastRoute]}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onOpenPreview && (
              <button
                type="button"
                onClick={onOpenPreview}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-gray-300 px-2 text-[11px] lg:hidden"
              >
                <PanelRightOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Preview
              </button>
            )}
            {onOpenDeploy && (
              <button
                type="button"
                onClick={onOpenDeploy}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2 text-[11px] font-medium text-white"
              >
                <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
                Deploy
              </button>
            )}
          </div>
        </div>
      )}

      {!aiOk && (
        <div className="flex shrink-0 items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            No AI provider is currently healthy. Review the{' '}
            <Link href="/admin/integrations/env-manager" className="font-semibold underline underline-offset-2">
              Environment Manager
            </Link>{' '}
            and deployment configuration.
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col items-center py-8 text-center sm:py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
              <Bot className="h-7 w-7 text-gray-800" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-gray-950">What do you need done?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Ask in plain language. Admin AI routes the request to the correct internal tool, database contract, workflow, builder, or deployment capability.
            </p>
            <p className="mt-1 text-xs text-gray-500">AI provider status: {health}</p>

            <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
              {QUICK.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => {
                    setInput(quick.text);
                    inputRef.current?.focus();
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
                    <Bot className="h-4 w-4 text-gray-800" aria-hidden="true" />
                  </div>
                )}
                <div
                  className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user' ? 'bg-gray-900 text-white' : assistantClass
                  }`}
                >
                  {message.provider && message.role === 'assistant' && (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {message.provider}
                      {message.route ? ` · ${ELLIE_ROUTE_LABEL[message.route]}` : ''}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-4 w-4 text-gray-700" aria-hidden="true" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-700" aria-hidden="true" />
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm ${assistantClass}`}>
                  Working…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className={`shrink-0 border-t p-4 ${inputAreaClass}`}>
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder="Tell Admin AI what you need done…"
              className={`min-h-[52px] flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none ${inputClass}`}
            />
            <button
              type="button"
              aria-label="Send request"
              disabled={!input.trim() || loading}
              onClick={() => void send()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-500">
            High-impact actions remain subject to authorization, MFA, validation, and audit logging.
          </p>
        </div>
      </div>
    </div>
  );
}
