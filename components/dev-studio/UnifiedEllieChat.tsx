'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  Loader2,
  Send,
  Sparkles,
  AlertTriangle,
  Rocket,
  PanelRightOpen,
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
  /** Parent provides header (mobile admin shell) */
  embedded?: boolean;
  /** Open file context for platform/code route */
  fileContext?: string;
}

const QUICK = [
  { label: 'Stats', text: 'Show platform stats and pending applications' },
  { label: 'Deploy LMS', text: 'Deploy the LMS service' },
  { label: 'Deploy admin', text: 'Deploy the admin service' },
  { label: 'Smoke test', text: 'Run smoke test' },
  { label: 'Fix deploy', text: 'Why did the last Northflank admin deploy fail? What should I check?' },
  { label: 'Search code', text: 'Search code for middleware errors in apps/admin' },
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
            if (row?.role === 'assistant') {
              next[assistantIdx] = { ...row, content: row.content + line };
            }
            return next;
          });
        });
      } else if (route === 'ops') {
        const { reply, action } = await sendOpsMessage(
          text,
          messages.map((m) => ({ role: m.role, content: m.content })),
        );
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: reply,
            provider: 'ellie-ops',
            route,
            action: (action as EllieAction) ?? null,
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: '', provider: 'platform', route }]);
        const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        await streamPlatformChat(history, {
          fileContext,
          onToken: (token) => {
            setMessages((prev) => {
              const next = [...prev];
              const row = next[assistantIdx];
              if (row?.role === 'assistant') {
                next[assistantIdx] = { ...row, content: row.content + token };
              }
              return next;
            });
          },
          onDone: (meta) => {
            setMessages((prev) => {
              const next = [...prev];
              const row = next[assistantIdx];
              if (row?.role === 'assistant') {
                next[assistantIdx] = {
                  ...row,
                  provider: meta.provider ?? row.provider,
                };
              }
              return next;
            });
          },
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err instanceof Error ? err.message : 'Request failed'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex h-full min-h-0 flex-col ${embedded ? "bg-white text-slate-900" : "bg-[#1e1e1e] text-[#cccccc]"}`}>
      {!embedded && (
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#3c3c3c] bg-[#252526] px-3 py-2">
        <Sparkles className="h-4 w-4 shrink-0 text-[#4ec9b0]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">Ellie</p>
          <p className="truncate text-[10px] text-[#858585]">
            Ops · deploy · code — {health}
            {lastRoute ? ` · last: ${ELLIE_ROUTE_LABEL[lastRoute]}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex h-8 items-center gap-1 rounded border border-[#555] px-2 text-[11px] lg:hidden"
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
              Preview
            </button>
          )}
          {onOpenDeploy && (
            <button
              type="button"
              onClick={onOpenDeploy}
              className="inline-flex h-8 items-center gap-1 rounded bg-[#0078d4] px-2 text-[11px] text-white"
            >
              <Rocket className="h-3.5 w-3.5" />
              Deploy
            </button>
          )}
        </div>
      </div>
      )}

      {!aiOk && (
        <div className="flex shrink-0 items-start gap-2 border-b border-amber-900/50 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Add API keys in{' '}
            <Link href="/admin/integrations/env-manager" className="underline">
              Environment Manager
            </Link>
            , then redeploy admin if the runtime needs the new keys.
          </p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4">
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col items-center py-8 text-center sm:py-12">
            <Bot className="mb-3 h-12 w-12 text-[#4ec9b0]" />
            <p className="text-sm text-[#e5e5e5]">One chat for the whole platform</p>
            <p className="mt-1 text-xs text-[#858585]">
              Live ops data, Northflank deploys, code/schema tools — same container, same Supabase & APIs.
            </p>
            <div className="mt-6 flex w-full flex-wrap justify-center gap-2">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => {
                    setInput(q.text);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-[#555] bg-[#2d2d2d] px-3 py-1.5 text-[11px] text-[#ccc] hover:border-[#0078d4]"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0078d4]">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[min(100%,28rem)] rounded-2xl px-3 py-2 text-sm leading-relaxed sm:max-w-[36rem] sm:px-4 ${
                    msg.role === 'user'
                      ? 'bg-[#0078d4] text-white'
                      : 'border border-[#3c3c3c] bg-[#2d2d2d] text-[#e5e5e5]'
                  }`}
                >
                  {msg.provider && msg.role === 'assistant' && (
                    <p className="mb-1 font-mono text-[10px] uppercase text-[#858585]">
                      {msg.provider}
                      {msg.route ? ` · ${ELLIE_ROUTE_LABEL[msg.route]}` : ''}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                {msg.role === 'user' && (
                  <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3c3c3c]">
                    <User className="h-4 w-4 text-[#ccc]" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0078d4]">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
                <div className="rounded-2xl border border-[#3c3c3c] bg-[#2d2d2d] px-4 py-2 text-sm text-[#858585]">
                  Working…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-[#3c3c3c] bg-[#252526] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            placeholder="Ask, deploy, or debug…"
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#555] bg-[#1e1e1e] px-3 py-2 text-sm text-white placeholder:text-[#666] focus:border-[#0078d4] focus:outline-none"
          />
          <button
            type="button"
            disabled={!input.trim() || loading}
            onClick={send}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0078d4] text-white disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
