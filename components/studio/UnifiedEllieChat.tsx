'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Bot,
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  PanelRightOpen,
  Rocket,
  Send,
  Shield,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Wrench,
  XCircle,
} from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';
import {
  studioUserFacingError,
  studioUserFacingToolName,
} from '@/lib/devstudio/user-facing-status';
import {
  createBrowserSpeechRecognition,
  type BrowserSpeechRecognition,
} from '@/lib/browser/speech-recognition';
import {
  ELLIE_ROUTE_LABEL,
  fetchAiHealth,
  routeEllieMessage,
  selectStudioAgent,
  shouldOrchestrateMessage,
  streamOrchestratedPlan,
  streamPlatformChat,
  type OrchestratedPlanCheckpoint,
  type EllieMessageRoute,
  type StudioSpecialist,
} from '@/lib/devstudio/ellie-unified-handlers';

type ToolCall = { tool: string; args: Record<string, unknown>; result: string };

const ANSI_STYLE_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function cleanRuntimeOutput(value: string): string {
  return value
    .replace(ANSI_STYLE_PATTERN, '')
    .replace(/\\x1b\[[0-9;]*m/g, '')
    .trim();
}

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

type StudioProvider =
  | 'auto'
  | 'elevate'
  | 'cloudflare'
  | 'xai'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'groq';

const STUDIO_PROVIDER_LABELS: Record<StudioProvider, string> = {
  auto: 'Best available',
  elevate: 'Elevate AI',
  cloudflare: 'Cloudflare AI',
  xai: 'Grok / xAI',
  openai: 'ChatGPT',
  anthropic: 'Claude',
  gemini: 'Gemini',
  groq: 'Groq',
};

interface UnifiedEllieChatProps {
  onOpenDeploy?: () => void;
  onOpenPreview?: () => void;
  embedded?: boolean;
  fileContext?: string;
  onPreviewTarget?: (url: string) => void;
  preferredAgent?: StudioSpecialist;
  onTaskCheckpoint?: (checkpoint: OrchestratedPlanCheckpoint | null) => void;
  onOpenTasks?: () => void;
  suggestedPrompt?: string;
  restoreLatest?: boolean;
  onConversationChange?: (conversationId: string | null) => void;
  onCommandStart?: (command: string) => void;
}

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function findElevatePreviewUrl(value: unknown): string | null {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const match = text.match(
    /https:\/\/(?:www|admin|app)\.elevateforhumanity\.org(?:\/[^\s"'<>]*)?/i,
  );
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

interface ConversationTask {
  id: string;
  title: string;
  status: string;
  tool_name?: string | null;
  approval_status?: string | null;
  approval_reason?: string | null;
  error_message?: string | null;
  result_json?: Record<string, unknown> | null;
  tool_output?: unknown;
  updated_at?: string | null;
}

function taskResultText(task: ConversationTask): string {
  const value = task.tool_output ?? task.result_json?.output ?? task.result_json?.summary;
  if (typeof value === 'string') return value;
  if (value == null) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/** The task ledger is rendered inside the conversation; tool panels never own the result. */
function ConversationActivity({ conversationId }: { conversationId: string | null }) {
  const [tasks, setTasks] = useState<ConversationTask[]>([]);
  const [actionError, setActionError] = useState('');

  const refresh = useCallback(async () => {
    if (!conversationId) {
      setTasks([]);
      return;
    }
    const response = await fetch(
      `/api/admin/dev-studio/tasks?conversationId=${encodeURIComponent(conversationId)}&limit=20`,
      { cache: 'no-store' },
    );
    if (!response.ok) return;
    const payload = await response.json().catch(() => ({ tasks: [] }));
    setTasks(Array.isArray(payload.tasks) ? payload.tasks : []);
  }, [conversationId]);

  useEffect(() => {
    void refresh();
    if (!conversationId) return;
    const timer = window.setInterval(() => void refresh(), 1500);
    return () => window.clearInterval(timer);
  }, [conversationId, refresh]);

  async function approve(taskId: string) {
    setActionError('');
    const response = await fetch(`/api/admin/dev-studio/tasks/${taskId}/approve`, {
      method: 'POST',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setActionError(payload.error || 'Could not approve this task.');
      return;
    }
    window.dispatchEvent(new CustomEvent('studio:task-approved', { detail: { taskId } }));
    await refresh();
  }

  if (!conversationId || !tasks.length) return null;

  return (
    <div className="shrink-0 border-b border-blue-100 bg-blue-50/70 px-4 py-3" aria-live="polite">
      <div className="mx-auto max-w-5xl space-y-2">
        <p className="text-xs font-black uppercase tracking-wide text-brand-blue-800">
          This conversation’s live work
        </p>
        {tasks.slice(0, 4).map((task) => {
          const result = taskResultText(task);
          const waiting = task.status === 'awaiting_approval';
          return (
            <div
              key={task.id}
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {task.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : task.status === 'failed' ? (
                  <XCircle className="h-4 w-4 text-red-600" />
                ) : task.status === 'blocked' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                ) : (
                  <Loader2 className={`h-4 w-4 text-blue-600 ${waiting ? '' : 'animate-spin'}`} />
                )}
                <span className="min-w-0 flex-1 font-bold text-slate-900">{task.title}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                  {task.status === 'failed'
                    ? 'execution failed'
                    : task.status === 'blocked'
                      ? 'capability required'
                      : task.status.replaceAll('_', ' ')}
                </span>
                {waiting ? (
                  <button
                    type="button"
                    onClick={() => void approve(task.id)}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 font-black text-white"
                  >
                    Approve this action
                  </button>
                ) : null}
              </div>
              {task.approval_reason ? (
                <p className="mt-2 text-xs text-amber-800">{task.approval_reason}</p>
              ) : null}
              {task.error_message ? (
                <p className="mt-2 text-xs text-red-700">
                  {studioUserFacingError(task.error_message)}
                </p>
              ) : result ? (
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-slate-600">
                  {result.slice(0, 1200)}
                </p>
              ) : null}
              <p className="mt-1 text-[10px] text-slate-400">
                {studioUserFacingToolName(task.tool_name)} · evidence {task.id}
              </p>
            </div>
          );
        })}
        {actionError ? <p className="text-xs font-semibold text-red-700">{actionError}</p> : null}
      </div>
    </div>
  );
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

interface CanonicalRunStep {
  id: string;
  title: string;
  status: string;
  ordinal: number;
  required: boolean;
  verification_summary?: string | null;
  error_message?: string | null;
}

interface CanonicalRunArtifact {
  id: string;
  artifact_type: string;
  label?: string | null;
  url?: string | null;
  validation_status?: string | null;
}

interface CanonicalRunPayload {
  run: {
    id: string;
    command: string;
    status: string;
    completed_at?: string | null;
  };
  steps: CanonicalRunStep[];
  artifacts: CanonicalRunArtifact[];
  events: Array<{ id: number; event_type: string; message?: string | null }>;
}

function CanonicalRunActivity({ runId }: { runId: string | null }) {
  const [payload, setPayload] = useState<CanonicalRunPayload | null>(null);
  const [loadError, setLoadError] = useState('');

  const refresh = useCallback(async () => {
    if (!runId) {
      setPayload(null);
      setLoadError('');
      return;
    }
    const response = await fetch(`/api/admin/dev-studio/runs/${encodeURIComponent(runId)}`, {
      cache: 'no-store',
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.run) {
      setLoadError(body?.error || 'Could not load the verified run checklist.');
      return;
    }
    setPayload(body as CanonicalRunPayload);
    setLoadError('');
  }, [runId]);

  useEffect(() => {
    void refresh();
    if (!runId) return;
    const timer = window.setInterval(() => void refresh(), 1500);
    return () => window.clearInterval(timer);
  }, [refresh, runId]);

  if (!runId) return null;
  if (!payload) {
    return (
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          {loadError ? (
            <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-brand-blue-700" aria-hidden="true" />
          )}
          {loadError || 'Loading the canonical run checklist…'}
        </div>
      </div>
    );
  }

  const required = payload.steps.filter((step) => step.required);
  const verified = required.filter((step) => step.status === 'verified').length;
  const percent = required.length ? Math.round((verified / required.length) * 100) : 0;
  const terminal = ['completed', 'failed', 'cancelled'].includes(payload.run.status);
  const blocked = payload.run.status === 'blocked';
  const latestEvent = payload.events[payload.events.length - 1];

  return (
    <section
      className="shrink-0 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3"
      aria-label="Canonical Studio run"
      aria-live="polite"
    >
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {payload.run.status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          ) : payload.run.status === 'failed' ? (
            <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
          ) : blocked ? (
            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-brand-blue-700" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-950">
              {payload.run.command || 'Studio workflow'}
            </p>
            <p className="text-[11px] font-semibold text-slate-600">
              {verified}/{required.length} required steps verified · {percent}% ·{' '}
              {payload.run.status}
            </p>
          </div>
          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-black uppercase tracking-wide text-brand-blue-800 ring-1 ring-blue-200">
            {terminal ? 'Final state' : blocked ? 'Action required' : 'Live'}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-blue-100">
          <div
            className={`h-full rounded-full transition-all ${payload.run.status === 'failed' ? 'bg-red-500' : blocked ? 'bg-amber-500' : 'bg-brand-blue-700'}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <ol className="grid gap-1.5 sm:grid-cols-2">
          {payload.steps.map((step) => (
            <li
              key={step.id}
              className="flex min-w-0 items-start gap-2 rounded-lg border border-blue-100 bg-white/90 px-2.5 py-2 text-xs"
            >
              {step.status === 'verified' ? (
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
              ) : step.status === 'failed' ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              ) : step.status === 'blocked' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              ) : step.status === 'running' ? (
                <Loader2
                  className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-blue-600"
                  aria-hidden="true"
                />
              ) : (
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[9px] font-bold text-slate-500">
                  {step.ordinal}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-bold text-slate-900">{step.title}</span>
                <span className="block truncate text-[10px] text-slate-500">
                  {step.error_message || step.verification_summary || step.status}
                </span>
              </span>
            </li>
          ))}
        </ol>
        {payload.artifacts.length ? (
          <div className="flex flex-wrap gap-2">
            {payload.artifacts.map((artifact) =>
              artifact.url ? (
                <a
                  key={artifact.id}
                  href={artifact.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-brand-blue-800 ring-1 ring-blue-200 hover:bg-blue-50"
                >
                  {artifact.label || artifact.artifact_type}
                </a>
              ) : (
                <span
                  key={artifact.id}
                  className="rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 ring-1 ring-blue-200"
                >
                  {artifact.label || artifact.artifact_type}
                </span>
              ),
            )}
          </div>
        ) : null}
        {latestEvent?.message ? (
          <p className="truncate text-[11px] text-slate-600">{latestEvent.message}</p>
        ) : null}
      </div>
    </section>
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
  onTaskCheckpoint,
  onOpenTasks,
  suggestedPrompt,
  restoreLatest = true,
  onConversationChange,
  onCommandStart,
}: UnifiedEllieChatProps) {
  const naturalVoice = useNaturalVoice();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState('checking…');
  const [aiOk, setAiOk] = useState(true);
  const [availableProviders, setAvailableProviders] = useState<Record<string, boolean>>({});
  const [selectedProvider, setSelectedProvider] = useState<StudioProvider>('auto');
  const [showActivity, setShowActivity] = useState(false);
  const [lastRoute, setLastRoute] = useState<EllieMessageRoute | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [attachment, setAttachment] = useState<{
    id: string;
    name: string;
    context: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [planCheckpoint, setPlanCheckpoint] = useState<OrchestratedPlanCheckpoint | null>(null);
  const [canonicalRunId, setCanonicalRunId] = useState<string | null>(null);
  const [checkpointError, setCheckpointError] = useState('');
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!suggestedPrompt?.trim()) return;
    setInput(suggestedPrompt);
    inputRef.current?.focus();
  }, [suggestedPrompt]);

  useEffect(() => {
    if (!restoreLatest) {
      setConversationId(null);
      setMessages([]);
      onConversationChange?.(null);
      return;
    }
    let cancelled = false;
    void fetch('/api/admin/dev-studio/conversations', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        const payload = await response.json();
        return Array.isArray(payload.conversations) ? payload.conversations[0] : null;
      })
      .then((conversation) => {
        if (cancelled || !conversation?.id) return;
        const restoredId = String(conversation.id);
        setConversationId(restoredId);
        onConversationChange?.(restoredId);
        if (Array.isArray(conversation.messages)) {
          setMessages(
            conversation.messages.filter(
              (message: ChatMessage) =>
                message &&
                (message.role === 'user' || message.role === 'assistant') &&
                typeof message.content === 'string',
            ),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [onConversationChange, restoreLatest]);

  async function ensureConversation(nextMessages: ChatMessage[]): Promise<string> {
    if (conversationId) return conversationId;
    const response = await fetch('/api/admin/dev-studio/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:
          nextMessages.find((message) => message.role === 'user')?.content.slice(0, 100) ||
          'Studio conversation',
        messages: nextMessages,
        config: { agent: preferredAgent ?? 'LIZZY', surface: 'unified-studio' },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.conversation?.id) {
      throw new Error(payload.error || 'Could not create the Studio conversation.');
    }
    const id = String(payload.conversation.id);
    setConversationId(id);
    onConversationChange?.(id);
    return id;
  }

  async function persistConversation(id: string, nextMessages: ChatMessage[]) {
    const firstUser = nextMessages.find((message) => message.role === 'user');
    const response = await fetch('/api/admin/dev-studio/conversations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        title: firstUser?.content.slice(0, 100) || 'Studio conversation',
        messages: nextMessages,
      }),
    });
    if (!response.ok) throw new Error('Could not save Studio conversation history.');
  }

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
      const documentId = typeof result.id === 'string' ? result.id : '';
      if (!documentId || documentId.startsWith('temp-')) {
        throw new Error('The file was stored but no durable Studio document record was created.');
      }
      const context = [
        `Attached file: ${file.name}`,
        `Studio document ID: ${documentId}`,
        `Content type: ${file.type || 'application/octet-stream'}`,
        `Size: ${file.size} bytes`,
        preview
          ? `Extracted content:\n${preview}`
          : 'No text could be extracted; use the authorized source URL when visual inspection is required.',
      ]
        .filter(Boolean)
        .join('\n');
      setAttachment({ id: documentId, name: file.name, context });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }

  useEffect(() => {
    fetchAiHealth().then(({ ok, label, providers }) => {
      setAiOk(ok);
      setHealth(label);
      setAvailableProviders(providers);
    });
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem('elevate:studio:provider') as StudioProvider | null;
    if (saved && saved in STUDIO_PROVIDER_LABELS) setSelectedProvider(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('elevate:studio:provider', selectedProvider);
  }, [selectedProvider]);

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

    const recognition = createBrowserSpeechRecognition();
    if (!recognition) {
      setSpeechError('Voice input is not supported by this browser.');
      return;
    }

    recognition.lang = 'en-US';
    recognition.continuous = true;
    // Chrome re-emits interim hypotheses as they improve. Appending those
    // hypotheses duplicates the same spoken phrase many times, so only consume
    // finalized recognition results.
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
        if (event.results[index].isFinal !== false) {
          transcript += event.results[index][0]?.transcript ?? '';
        }
      }
      if (transcript.trim()) {
        setInput((current) => `${current}${current.trim() ? ' ' : ''}${transcript.trim()}`);
      }
    };
    recognition.onerror = (event) => {
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

  function speakAssistantResponse(text: string) {
    if (!voiceOutputEnabled || !text.trim()) return;
    const clean = cleanRuntimeOutput(text)
      .replace(/[`*_#]/g, '')
      .trim()
      .slice(-1800);
    void naturalVoice.play(clean, {
      voice: 'coral',
      style: 'assistant',
      rate: 1.08,
      allowBrowserFallback: false,
    });
  }

  function receiveCheckpoint(checkpoint: OrchestratedPlanCheckpoint) {
    if (checkpoint.runId) setCanonicalRunId(checkpoint.runId);
    const active =
      checkpoint.status === 'done' || checkpoint.status === 'failed' ? null : checkpoint;
    setPlanCheckpoint(active);
    onTaskCheckpoint?.(active);
  }

  async function approveAndResumePlan() {
    if (!planCheckpoint?.taskId || loading) return;
    setLoading(true);
    setCheckpointError('');
    try {
      const approval = await fetch(`/api/admin/dev-studio/tasks/${planCheckpoint.taskId}/approve`, {
        method: 'POST',
      });
      const approvalBody = await approval.json().catch(() => ({}));
      if (!approval.ok) throw new Error(approvalBody.error || 'Could not approve task');

      const assistantIdx = messages.length;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Approval recorded. Resuming the same plan…',
          provider: 'registered-tools',
        },
      ]);
      await streamOrchestratedPlan(
        '',
        (line) => {
          const clean = line.replace(ANSI_PATTERN, '').trimEnd();
          setMessages((current) => {
            const next = [...current];
            const row = next[assistantIdx];
            if (row?.role === 'assistant')
              next[assistantIdx] = { ...row, content: `${row.content}\n${clean}`.trim() };
            return next;
          });
        },
        {
          planId: planCheckpoint.planId,
          conversationId: conversationId ?? undefined,
          onCheckpoint: receiveCheckpoint,
          onRunId: setCanonicalRunId,
        },
      );
    } catch (error) {
      setCheckpointError(error instanceof Error ? error.message : 'Could not resume plan');
    } finally {
      setLoading(false);
    }
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
    let spokenText = '';

    try {
      const canonicalConversationId = await ensureConversation([...messages, userMsg]);
      {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', provider: 'admin-ai', route, agent },
        ]);
        const command = [text, fileContext, attachment?.context].filter(Boolean).join('\n\n');
        const appendLine = (line: string) => {
          const clean = line.replace(ANSI_PATTERN, '').trimEnd();
          spokenText += `${spokenText ? '\n' : ''}${clean}`;
          setMessages((prev) => {
            const next = [...prev];
            const row = next[assistantIdx];
            if (row?.role === 'assistant')
              next[assistantIdx] = {
                ...row,
                provider: 'registered-tools',
                content: `${row.content}${row.content ? '\n' : ''}${clean}`,
              };
            return next;
          });
        };

        if (shouldOrchestrateMessage(command)) {
          onCommandStart?.(command);
          // Outcome requests use the durable Codex-style runtime: persisted
          // plan → registered tools → evaluator → retry/approval checkpoint.
          await streamOrchestratedPlan(command, appendLine, {
            documentIds: attachment ? [attachment.id] : [],
            conversationId: canonicalConversationId,
            onCheckpoint: receiveCheckpoint,
            onRunId: setCanonicalRunId,
          });
        } else {
          // Questions retain conversation context and the unified provider
          // fallback path instead of being forced through a stateless command.
          await streamPlatformChat(
            [...messages.map(({ role, content }) => ({ role, content })), userMsg],
            {
              agent: 'ADMIN_AI',
              fileContext,
              documentsContext: attachment?.context,
              provider: selectedProvider === 'auto' ? undefined : selectedProvider,
              onToken: (token) => {
                spokenText += token;
                setMessages((prev) => {
                  const next = [...prev];
                  const row = next[assistantIdx];
                  if (row?.role === 'assistant') {
                    next[assistantIdx] = {
                      ...row,
                      provider: 'admin-ai',
                      content: `${row.content}${token}`,
                    };
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
                      toolCalls: meta.toolCalls,
                      capabilitiesUsed: meta.capabilitiesUsed,
                    };
                  }
                  return next;
                });
              },
            },
          );
        }
        speakAssistantResponse(spokenText);
        await persistConversation(canonicalConversationId, [
          ...messages,
          userMsg,
          { role: 'assistant', content: spokenText, provider: 'admin-ai', route, agent },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Request failed: ${studioUserFacingError(error)}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const shellClass = embedded ? 'bg-white text-gray-950' : 'bg-gray-950 text-gray-100';
  const headerClass = embedded ? 'border-gray-200 bg-white' : 'border-gray-800 bg-gray-900';
  const assistantClass = embedded
    ? 'border border-brand-blue-100 bg-brand-blue-50/70 text-slate-950 shadow-sm'
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

      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <label className="sr-only" htmlFor="studio-ai-provider">
            Choose AI
          </label>
          <select
            id="studio-ai-provider"
            value={selectedProvider}
            onChange={(event) => setSelectedProvider(event.target.value as StudioProvider)}
            className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800"
          >
            {(Object.keys(STUDIO_PROVIDER_LABELS) as StudioProvider[]).map((provider) => (
              <option
                key={provider}
                value={provider}
                disabled={provider !== 'auto' && !availableProviders[provider]}
              >
                {STUDIO_PROVIDER_LABELS[provider]}
                {provider !== 'auto' && !availableProviders[provider] ? ' — unavailable' : ''}
              </option>
            ))}
          </select>
          <span className="hidden truncate text-xs text-slate-500 sm:inline">
            {selectedProvider === 'auto'
              ? health
              : `${STUDIO_PROVIDER_LABELS[selectedProvider]} selected`}
          </span>
          <button
            type="button"
            onClick={() => setShowActivity((visible) => !visible)}
            aria-expanded={showActivity}
            className="ml-auto inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Activity className="h-4 w-4" aria-hidden="true" />
            {showActivity ? 'Hide activity' : 'Activity'}
          </button>
        </div>
      </div>

      {showActivity ? (
        <div className="max-h-[42vh] shrink-0 overflow-y-auto border-b border-slate-200">
          <CanonicalRunActivity runId={canonicalRunId} />
          <CourseBuildRuns />
          <ConversationActivity conversationId={conversationId} />
        </div>
      ) : null}

      {planCheckpoint?.status === 'awaiting_approval' ? (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
            <Shield className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                Approval needed: {planCheckpoint.title || 'Continue plan'}
              </p>
              <p className="truncate text-xs text-amber-800">
                {planCheckpoint.reason || `Task ${planCheckpoint.taskId}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void approveAndResumePlan()}
              disabled={loading}
              className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
            >
              Approve and continue this flow
            </button>
            <button type="button" onClick={onOpenTasks} className="text-xs font-bold underline">
              Evidence
            </button>
          </div>
          {checkpointError ? (
            <p role="alert" className="mx-auto mt-2 max-w-5xl text-xs text-red-700">
              {checkpointError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-gradient-to-b from-white via-white to-brand-blue-50/30 px-3 py-4 sm:px-8 sm:py-8">
        {messages.length === 0 ? (
          <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col items-center py-8 text-center sm:py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue-700 shadow-lg shadow-brand-blue-700/20 ring-4 ring-brand-blue-100">
              <Bot className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-gray-950">
              What are we building today?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Ask in plain language. Admin AI routes the request to the correct internal tool,
              database contract, workflow, builder, or deployment capability.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              LIZZY runtime: {aiOk ? 'connected' : 'configuration required'}
            </p>

            <div className="mt-5 grid w-full min-w-0 grid-cols-1 gap-2 sm:mt-7 sm:grid-cols-2">
              {QUICK.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  onClick={() => {
                    setInput(quick.text);
                    inputRef.current?.focus();
                  }}
                  className="w-full min-w-0 rounded-2xl border border-brand-blue-100 bg-white px-4 py-4 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-600 focus-visible:ring-offset-2"
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
                      message.role === 'user'
                        ? 'bg-brand-blue-700 text-white shadow-sm'
                        : assistantClass
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {message.agent ?? preferredAgent ?? 'LIZZY'}
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
          <div className="flex w-full min-w-0 flex-wrap items-end gap-2 rounded-2xl border border-brand-blue-200 bg-white p-2 shadow-lg shadow-slate-900/5 focus-within:border-brand-blue-500 focus-within:ring-2 focus-within:ring-brand-blue-100">
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
            <input
              ref={cameraInputRef}
              type="file"
              className="sr-only"
              accept="image/*"
              capture="environment"
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
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Paperclip className="h-5 w-5" aria-hidden="true" />
              )}
              <span className="text-xs font-semibold">Files</span>
            </button>
            <button
              type="button"
              aria-label="Take a photo"
              disabled={uploading}
              onClick={() => cameraInputRef.current?.click()}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <Camera className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-semibold">Camera</span>
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
              className={`order-first min-h-[88px] w-full min-w-0 basis-full resize-none rounded-xl border px-3 py-2 text-base outline-none sm:min-h-[72px] sm:text-sm ${inputClass}`}
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
              aria-label={voiceOutputEnabled ? 'Turn voice output off' : 'Turn voice output on'}
              aria-pressed={voiceOutputEnabled}
              onClick={() => {
                setVoiceOutputEnabled((enabled) => {
                  if (enabled) naturalVoice.stop();
                  return !enabled;
                });
              }}
              className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {voiceOutputEnabled ? (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5" aria-hidden="true" />
              )}
              <span>{voiceOutputEnabled ? 'Voice on' : 'Voice off'}</span>
            </button>
            <button
              type="button"
              aria-label="Send request"
              disabled={!input.trim() || loading}
              onClick={() => void send()}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-4 text-sm font-bold text-white transition hover:bg-brand-red-800 disabled:cursor-not-allowed disabled:opacity-40"
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
