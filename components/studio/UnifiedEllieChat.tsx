'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  PanelRightOpen,
  Rocket,
  Send,
  Sparkles,
  User,
  Wrench,
  XCircle,
} from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';
import {
  ELLIE_ROUTE_LABEL,
  fetchAiHealth,
  routeEllieMessage,
  selectStudioAgent,
  streamExecuteCommand,
  type EllieMessageRoute,
  type StudioSpecialist,
} from '@/lib/devstudio/ellie-unified-handlers';

type ToolCall = { tool: string; args: Record<string, unknown>; result: string };

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
  agent?: StudioSpecialist;
  toolCalls?: ToolCall[];
  action?: EllieAction | null;
  capabilitiesUsed?: string[];
  actionOutcome?: { status: 'executed' | 'rejected' | 'failed'; message: string };
}

interface UnifiedEllieChatProps {
  onOpenDeploy?: () => void;
  onOpenPreview?: () => void;
  embedded?: boolean;
  fileContext?: string;
  onPreviewTarget?: (url: string) => void;
  preferredAgent?: StudioSpecialist;
}

function findElevatePreviewUrl(value: unknown): string | null {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const match = text.match(/https:\/\/(?:www|admin|app)\.elevateforhumanity\.org(?:\/[^\s"'<>]*)?/i);
  return match?.[0] ?? null;
}

interface StudioJob {
  id: string;
  command: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  stage?: string | null;
  progress?: number | null;
  error?: string | null;
  attempts?: number;
  max_attempts?: number;
  tool_name?: string | null;
}

function CourseBuildRuns() {
  const [jobs, setJobs] = useState<StudioJob[]>([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const response = await fetch('/api/admin/dev-studio/jobs?limit=8&status=all', {
        cache: 'no-store',
      });
      if (!response.ok || !active) return;
      const body = await response.json().catch(() => ({ jobs: [] }));
      if (active)
        setJobs((body.jobs ?? []).filter((job: StudioJob) => job.tool_name === 'build_course'));
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!jobs.length) return null;
  return (
    <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3" aria-live="polite">
      <div className="mx-auto max-w-4xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Course Builder runs
        </p>
        {jobs.slice(0, 3).map((job) => {
          const progress = Math.max(0, Math.min(100, job.progress ?? 0));
          return (
            <div
              key={job.id}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs">
                {job.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : job.status === 'failed' ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                <span className="min-w-0 flex-1 truncate font-semibold text-gray-900">
                  {job.command}
                </span>
                <span className="text-gray-500">
                  {job.stage ?? job.status} · {progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${job.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {job.error ? <p className="mt-2 text-xs text-red-700">{job.error}</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
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

function ToolActivity({ toolCalls }: { toolCalls: ToolCall[] }) {
  if (!toolCalls.length) return null;

  return (
    <details className="mt-3 rounded-xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 marker:hidden">
        <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
        {toolCalls.length === 1 ? '1 tool used' : `${toolCalls.length} tools used`}
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
      </summary>
      <div className="space-y-2 border-t border-gray-100 p-3">
        {toolCalls.map((call, index) => (
          <details
            key={`${call.tool}-${index}`}
            className="rounded-lg border border-gray-100 bg-gray-50"
          >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-gray-700">
              {call.tool}
            </summary>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap border-t border-gray-100 bg-white p-3 text-[11px] leading-5 text-gray-600">
              {call.result.slice(0, 6000)}
            </pre>
          </details>
        ))}
      </div>
    </details>
  );
}

function ActionCard({
  action,
  onDecision,
}: {
  action: EllieAction;
  onDecision: (decision: 'approve' | 'reject') => Promise<void>;
}) {
  const [resolving, setResolving] = useState(false);
  const highImpact = action.dangerLevel === 'high';

  async function decide(decision: 'approve' | 'reject') {
    if (resolving) return;
    setResolving(true);
    try {
      await onDecision(decision);
    } finally {
      setResolving(false);
    }
  }

  return (
    <div
      className={`mt-3 overflow-hidden rounded-xl border ${highImpact ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-950">{action.label}</p>
            {action.description && (
              <p className="mt-1 text-xs leading-5 text-gray-600">{action.description}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full border border-current/10 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
            {action.dangerLevel} impact
          </span>
        </div>
        {action.targetCount > 1 && (
          <p className="mt-2 text-xs font-medium text-gray-700">
            Affects {action.targetCount} records.
          </p>
        )}
      </div>
      <div className="flex gap-2 border-t border-black/5 bg-white/70 px-4 py-3">
        <button
          type="button"
          disabled={resolving}
          onClick={() => void decide('approve')}
          className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {resolving ? 'Working…' : 'Confirm action'}
        </button>
        <button
          type="button"
          disabled={resolving}
          onClick={() => void decide('reject')}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function UnifiedEllieChat({
  onOpenDeploy,
  onOpenPreview,
  embedded = false,
  fileContext,
  onPreviewTarget,
  preferredAgent,
}: UnifiedEllieChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState('checking…');
  const [aiOk, setAiOk] = useState(true);
  const [lastRoute, setLastRoute] = useState<EllieMessageRoute | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; context: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  async function uploadAttachment(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('label', file.name);
      const response = await fetch('/api/admin/dev-studio/upload', { method: 'POST', body: form });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error ?? `Upload failed (HTTP ${response.status})`);
      const preview =
        typeof result.content_preview === 'string' ? result.content_preview.trim() : '';
      const context = [
        `Attached file: ${file.name}`,
        `Content type: ${file.type || 'application/octet-stream'}`,
        `Size: ${file.size} bytes`,
        result.url ? `Authorized source URL: ${result.url}` : '',
        preview
          ? `Extracted content:\n${preview}`
          : 'No text could be extracted; use the authorized source URL when visual inspection is required.',
      ]
        .filter(Boolean)
        .join('\n');
      setAttachment({ name: file.name, context });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  }

  useEffect(() => {
    fetchAiHealth().then(({ ok, label }) => {
      setAiOk(ok);
      setHealth(label);
    });
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function resolveAction(
    messageIndex: number,
    action: EllieAction,
    decision: 'approve' | 'reject',
  ) {
    try {
      const response = await fetch('/api/admin/ai-assistant/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.id, decision }),
      });
      const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const actionPreview = findElevatePreviewUrl(data?.result);
      if (decision === 'approve' && actionPreview) onPreviewTarget?.(actionPreview);
      const outcome: NonNullable<ChatMessage['actionOutcome']> = response.ok
        ? {
            status:
              decision === 'reject'
                ? 'rejected'
                : data.result?.success === false
                  ? 'failed'
                  : 'executed',
            message:
              decision === 'reject'
                ? 'Action cancelled.'
                : (data.result?.message ??
                  (data.result?.success === false ? 'Action failed.' : 'Action completed.')),
          }
        : { status: 'failed', message: data.error ?? 'Action failed.' };

      setMessages((current) =>
        current.map((message, index) =>
          index === messageIndex ? { ...message, action: null, actionOutcome: outcome } : message,
        ),
      );
    } catch (error) {
      setMessages((current) =>
        current.map((message, index) =>
          index === messageIndex
            ? {
                ...message,
                action: null,
                actionOutcome: {
                  status: 'failed',
                  message: error instanceof Error ? error.message : 'Action failed.',
                },
              }
            : message,
        ),
      );
    }
  }

  function toggleSpeechRecognition() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice input is not supported by this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0]?.transcript ?? '';
      }
      if (transcript.trim()) {
        setInput((current) => `${current}${current.trim() ? ' ' : ''}${transcript.trim()}`);
      }
    };
    recognition.onerror = (event: any) => {
      setSpeechError(
        event.error === 'not-allowed'
          ? 'Microphone access is blocked. Allow microphone access for admin.elevateforhumanity.org in your browser site settings, reload this page, then press the microphone again. You can continue typing while voice input is unavailable.'
          : `Voice input stopped: ${event.error ?? 'unknown error'}`,
      );
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setSpeechError(null);
    setListening(true);
    recognition.start();
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    const route = attachment ? 'platform' : routeEllieMessage(text);
    const agent = preferredAgent ?? selectStudioAgent(text);
    setLastRoute(route);
    const userMsg: ChatMessage = { role: 'user', content: text, route, agent };
    setMessages((prev) => [...prev, userMsg]);
    const assistantIdx = messages.length + 1;

    try {
      {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', provider: 'admin-ai', route, agent },
        ]);
        const command = [text, fileContext, attachment?.context].filter(Boolean).join('\n\n');
        await streamExecuteCommand(command, (line) => {
            setMessages((prev) => {
              const next = [...prev];
              const row = next[assistantIdx];
              if (row?.role === 'assistant')
                next[assistantIdx] = {
                  ...row,
                  provider: 'registered-tools',
                  content: `${row.content}${row.content ? '\n' : ''}${line}`,
                };
              return next;
            });
        }, agent);
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
    <div className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden ${shellClass}`}>
      {!embedded && (
        <div
          className={`flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3 ${headerClass}`}
        >
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
            <Link
              href={getAdminUrl('/integrations/env-manager')}
              className="font-semibold underline underline-offset-2"
            >
              Environment Manager
            </Link>{' '}
            and deployment configuration.
          </p>
        </div>
      )}

      <CourseBuildRuns />

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 sm:px-8 sm:py-8">
        {messages.length === 0 ? (
          <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col items-center py-8 text-center sm:py-20">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
              <Bot className="h-7 w-7 text-gray-800" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-gray-950">
              What do you need done?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Ask in plain language. Admin AI routes the request to the correct internal tool,
              database contract, workflow, builder, or deployment capability.
            </p>
            <p className="mt-1 text-xs text-gray-500">AI provider status: {health}</p>

            <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-2 sm:mt-7 sm:grid-cols-2">
              {QUICK.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => {
                    setInput(quick.text);
                    inputRef.current?.focus();
                  }}
                  className="w-full min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
                    <Bot className="h-4 w-4 text-gray-800" aria-hidden="true" />
                  </div>
                )}
                <div className="max-w-[min(100%,44rem)]">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === 'user' ? 'bg-gray-900 text-white' : assistantClass
                    }`}
                  >
                    {message.provider && message.role === 'assistant' && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {message.provider}
                        {message.agent ? ` · ${message.agent}` : ''}
                        {message.route ? ` · ${ELLIE_ROUTE_LABEL[message.route]}` : ''}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    {message.role === 'assistant' && message.capabilitiesUsed?.length ? (
                      <p className="mt-2 text-[11px] text-gray-500">
                        Capabilities used: {message.capabilitiesUsed.join(', ')}
                      </p>
                    ) : null}
                    {message.role === 'assistant' && message.toolCalls?.length ? (
                      <ToolActivity toolCalls={message.toolCalls} />
                    ) : null}
                    {message.role === 'assistant' && message.action ? (
                      <ActionCard
                        action={message.action}
                        onDecision={(decision) =>
                          resolveAction(index, message.action as EllieAction, decision)
                        }
                      />
                    ) : null}
                    {message.actionOutcome ? (
                      <div
                        className={`mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs ${
                          message.actionOutcome.status === 'executed'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : message.actionOutcome.status === 'rejected'
                              ? 'border-gray-200 bg-gray-50 text-gray-700'
                              : 'border-red-200 bg-red-50 text-red-800'
                        }`}
                      >
                        {message.actionOutcome.status === 'executed' ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>{message.actionOutcome.message}</span>
                      </div>
                    ) : null}
                  </div>
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
                <div className={`rounded-2xl px-4 py-3 text-sm ${assistantClass}`}>Working…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className={`min-w-0 shrink-0 border-t p-3 sm:p-4 ${inputAreaClass}`}>
        <div className="mx-auto w-full min-w-0 max-w-5xl">
          {attachment ? (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
              <span className="min-w-0 truncate font-semibold">Attached: {attachment.name}</span>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="shrink-0 font-bold hover:underline"
              >
                Remove
              </button>
            </div>
          ) : null}
          {uploadError ? (
            <p role="alert" className="mb-2 text-xs font-medium text-red-700">
              {uploadError}
            </p>
          ) : null}
          <div className="flex w-full min-w-0 flex-wrap items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 sm:flex-nowrap">
            <input
              ref={attachmentInputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAttachment(file);
              }}
            />
            <button
              type="button"
              aria-label="Attach a file"
              disabled={uploading}
              onClick={() => attachmentInputRef.current?.click()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Paperclip className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
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
              placeholder="Tell Admin AI what you need done..."
              className={`order-first min-h-[88px] min-w-0 basis-full resize-none rounded-xl border px-3 py-2 text-base outline-none sm:order-none sm:min-h-[52px] sm:flex-1 sm:basis-auto sm:text-sm ${inputClass}`}
            />
            <button
              type="button"
              aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              aria-pressed={listening}
              onClick={toggleSpeechRecognition}
              className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${
                listening
                  ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {listening ? (
                <MicOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Mic className="h-5 w-5" aria-hidden="true" />
              )}
              <span>{listening ? 'Stop listening' : `Talk to ${preferredAgent ?? 'Lizzy'}`}</span>
            </button>
            <button
              type="button"
              aria-label="Send request"
              disabled={!input.trim() || loading}
              onClick={() => void send()}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-5 w-5" aria-hidden="true" />
              )}
              <span>Send</span>
            </button>
          </div>
          {speechError ? (
            <p role="alert" className="mt-2 text-center text-xs font-medium text-red-700">
              {speechError}
            </p>
          ) : listening ? (
            <p role="status" className="mt-2 text-center text-xs font-medium text-red-700">
              Listening… tap the microphone again to stop.
            </p>
          ) : null}
          <p className="mt-2 text-center text-[11px] text-gray-500">
            Governed actions use configured rules and are written to the audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
