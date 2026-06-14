'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Send, Bot, User, Loader2, Copy, Check, Sparkles, Paperclip,
  AlertTriangle, Database, Terminal, Zap, ChevronDown, ChevronRight,
  BookOpen, Video, FileText, PenLine, ExternalLink, Play, RefreshCw,
} from 'lucide-react';

interface EllieAction {
  id: string;           // ellie_pending_actions.id — required to call /approve
  type: string;
  label: string;
  params: Record<string, unknown>;
  targetCount: number;
  dangerLevel: 'low' | 'medium' | 'high';
  description: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: { tool: string; args: Record<string, unknown>; result: string }[];
  provider?: string;
  model?: string;
  // Ellie ops mode — staged action awaiting approval
  action?: EllieAction | null;
  // After approval/rejection, the outcome replaces the card
  actionOutcome?: { status: 'executed' | 'rejected' | 'failed'; message: string };
}

interface AIChatProps {
  fileContext?: string;
  onApplyCode?: (filename: string, code: string) => void;
  /** When true, routes through /api/admin/ai-assistant (Ellie ops mode) */
  ellieMode?: boolean;
}

type ProviderId = 'auto' | 'groq' | 'openai' | 'anthropic' | 'gemini';

const MODEL_OPTIONS: Record<ProviderId, string[]> = {
  auto: ['auto'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
  anthropic: ['claude-sonnet-4-5', 'claude-3-5-haiku-latest'],
  gemini: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
};

const PROVIDER_LABELS: Record<ProviderId, string> = {
  auto: 'Auto',
  groq: 'Groq',
  openai: 'ChatGPT / OpenAI',
  anthropic: 'Claude / Anthropic',
  gemini: 'Gemini',
};

export const TOOL_META: Record<string, { label: string; color: string; icon: React.ElementType<{ className?: string }> }> = {
  list_programs:                    { label: 'Programs',         color: 'text-brand-blue-700', icon: Database  },
  list_enrollments:                 { label: 'Enrollments',      color: 'text-brand-green-700',      icon: Database  },
  get_dashboard_stats:              { label: 'Stats',            color: 'text-amber-700',      icon: Zap       },
  get_recent_applications:          { label: 'Applications',     color: 'text-orange-700',     icon: Database  },
  inspect_platform_registry:        { label: 'Platform Registry',color: 'text-brand-blue-700', icon: Database  },
  query_program_by_slug:            { label: 'Program',          color: 'text-brand-blue-700', icon: Database  },
  inspect_route:                    { label: 'Route',            color: 'text-slate-700',      icon: Terminal  },
  get_component_source:             { label: 'Source',           color: 'text-slate-700',      icon: Terminal  },
  search_schema:                    { label: 'Schema',           color: 'text-brand-blue-700', icon: Database  },
  search_code:                      { label: 'Code Search',      color: 'text-slate-700',      icon: Terminal  },
  audit_auth_flow:                  { label: 'Auth Audit',       color: 'text-red-700',        icon: Database  },
  inspect_build_errors:             { label: 'Build Logs',       color: 'text-amber-700',      icon: Terminal  },
  list_blueprints:                  { label: 'Blueprints',       color: 'text-purple-700',     icon: Database  },
  design_page_template:             { label: 'Page Template',    color: 'text-indigo-700',     icon: Sparkles  },
  run_safe_command:                 { label: 'Shell',            color: 'text-slate-700',      icon: Terminal  },
  build_course:                     { label: 'Build Course',     color: 'text-purple-700',     icon: BookOpen  },
  save_course:                      { label: 'Save Course',      color: 'text-brand-green-700',      icon: BookOpen  },
  generate_videos:                  { label: 'Generate Videos',  color: 'text-rose-700',       icon: Video     },
  analyze_document:                 { label: 'Analyze Document', color: 'text-amber-700',      icon: FileText  },
  apply_document_to_application:    { label: 'Apply to App',     color: 'text-brand-green-700',      icon: PenLine   },
};

// ── Rich tool result renderers ────────────────────────────────────────────────

interface CourseModule { title: string; lessons?: string[]; lesson_count?: number }
interface CourseDraft {
  title?: string; description?: string; modules?: CourseModule[];
  course_id?: string; total_lessons?: number; status?: string;
}

function CourseCard({ result }: { result: string }) {
  let data: CourseDraft;
  try { data = JSON.parse(result); } catch { return null; }
  if (!data.title && !data.course_id) return null;

  return (
    <div className="mt-2 rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 border-b border-purple-200">
        <BookOpen className="w-4 h-4 text-purple-700" />
        <span className="text-sm font-semibold text-purple-900">{data.title ?? 'Course Draft'}</span>
        {data.status && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-700 font-medium uppercase tracking-wide">
            {data.status}
          </span>
        )}
      </div>
      {data.description && (
        <p className="px-3 py-2 text-xs text-slate-600 border-b border-purple-100">{data.description}</p>
      )}
      {data.modules && data.modules.length > 0 && (
        <div className="px-3 py-2 space-y-1">
          {data.modules.slice(0, 6).map((mod, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
              <span className="font-medium">{mod.title}</span>
              {(mod.lessons?.length ?? mod.lesson_count) && (
                <span className="ml-auto text-slate-400 flex-shrink-0">
                  {mod.lessons?.length ?? mod.lesson_count} lessons
                </span>
              )}
            </div>
          ))}
          {data.modules.length > 6 && (
            <p className="text-[11px] text-slate-400 pl-7">+{data.modules.length - 6} more modules</p>
          )}
        </div>
      )}
      {(data.total_lessons || data.course_id) && (
        <div className="flex items-center gap-3 px-3 py-2 bg-purple-100 border-t border-purple-200 text-[11px] text-purple-700">
          {data.total_lessons && <span>{data.total_lessons} total lessons</span>}
          {data.course_id && (
            <Link href={`/admin/courses/${data.course_id}`} target="_blank" rel="noreferrer"
              className="ml-auto flex items-center gap-1 hover:underline">
              Open course <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

interface VideoJob { lesson_id?: string; title?: string; status?: string; video_url?: string; duration_s?: number }
interface VideoGenResult { jobs?: VideoJob[]; total?: number; queued?: number; completed?: number; failed?: number }

function VideoProgressCard({ result }: { result: string }) {
  let data: VideoGenResult;
  try { data = JSON.parse(result); } catch { return null; }
  if (!data.jobs && !data.total) return null;

  const jobs = data.jobs ?? [];
  const done = data.completed ?? jobs.filter(j => j.status === 'completed').length;
  const total = data.total ?? jobs.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-rose-100 border-b border-rose-200">
        <Video className="w-4 h-4 text-rose-700" />
        <span className="text-sm font-semibold text-rose-900">Video Generation</span>
        <span className="ml-auto text-xs text-rose-700">{done}/{total} complete</span>
      </div>
      <div className="px-3 py-2">
        <div className="w-full bg-rose-200 rounded-full h-1.5 mb-2">
          <div className="bg-rose-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {jobs.slice(0, 8).map((job, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              {job.status === 'completed'
                ? <span className="w-3.5 h-3.5 rounded-full bg-brand-green-600 inline-block flex-shrink-0" aria-hidden="true" />
                : job.status === 'failed'
                ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                : <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin flex-shrink-0" />}
              <span className="text-slate-700 truncate flex-1">{job.title ?? job.lesson_id ?? `Job ${i + 1}`}</span>
              {job.video_url && (
                <a href={job.video_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-0.5 text-rose-600 hover:underline flex-shrink-0">
                  <Play className="w-3 h-3" /> Play
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface DocField { field: string; value: string; confidence?: number }
interface DocAnalysisResult {
  document_id?: string; file_name?: string; fields?: DocField[];
  extracted_data?: { fields?: Record<string, string> };
  auto_applied?: boolean; fields_applied?: string[];
  anomalies?: string[]; field_count?: number;
}

function DocumentAnalysisCard({ result }: { result: string }) {
  let data: DocAnalysisResult;
  try { data = JSON.parse(result); } catch { return null; }
  const fields = data.fields ?? Object.entries(data.extracted_data?.fields ?? {}).map(([field, value]) => ({ field, value }));
  if (!fields.length && !data.anomalies?.length) return null;

  return (
    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-100 border-b border-amber-200">
        <FileText className="w-4 h-4 text-amber-700" />
        <span className="text-sm font-semibold text-amber-900">{data.file_name ?? 'Document Analysis'}</span>
        {data.auto_applied && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-brand-green-100 text-brand-green-700 font-medium">
            ✓ Auto-applied
          </span>
        )}
      </div>
      {fields.length > 0 && (
        <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {fields.slice(0, 10).map((f, i) => (
            <div key={i} className="text-xs">
              <span className="text-slate-400 capitalize">{String(f.field).replace(/_/g, ' ')}: </span>
              <span className="text-slate-800 font-medium">{String(f.value)}</span>
            </div>
          ))}
        </div>
      )}
      {data.anomalies && data.anomalies.length > 0 && (
        <div className="px-3 py-2 border-t border-amber-200">
          {data.anomalies.map((a, i) => (
            <p key={i} className="text-xs text-amber-800 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" /> {a}
            </p>
          ))}
        </div>
      )}
      {data.fields_applied && data.fields_applied.length > 0 && (
        <div className="px-3 py-1.5 bg-brand-green-50 border-t border-brand-green-200 text-[11px] text-brand-green-700">
          Applied to application: {data.fields_applied.join(', ')}
        </div>
      )}
    </div>
  );
}

// ── Ellie approval card ───────────────────────────────────────────────────────

const DANGER_STYLES = {
  low:    { border: 'border-blue-200',  bg: 'bg-blue-50',  badge: 'bg-blue-100 text-blue-700',  confirm: 'bg-blue-600 hover:bg-blue-700' },
  medium: { border: 'border-amber-200', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', confirm: 'bg-amber-600 hover:bg-amber-700' },
  high:   { border: 'border-red-200',   bg: 'bg-red-50',   badge: 'bg-red-100 text-red-700',     confirm: 'bg-red-600 hover:bg-red-700' },
};

function EllieApprovalCard({
  action,
  onApprove,
  onReject,
}: {
  action: EllieAction;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [resolving, setResolving] = useState(false);
  const styles = DANGER_STYLES[action.dangerLevel ?? 'medium'];

  const handleApprove = async () => { setResolving(true); onApprove(); };
  const handleReject  = async () => { setResolving(true); onReject(); };

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden max-w-sm`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-inherit">
        <Sparkles className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <span className="text-xs font-semibold text-slate-800 flex-1">{action.label}</span>
        {action.targetCount > 1 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>
            {action.targetCount} records
          </span>
        )}
      </div>
      {action.description && (
        <p className="px-3 py-2 text-[11px] text-slate-600 border-b border-inherit">
          {action.description}
        </p>
      )}
      <div className="flex gap-2 px-3 py-2">
        <button
          onClick={handleApprove}
          disabled={resolving}
          className={`flex-1 text-xs font-bold text-white py-1.5 rounded-lg transition-colors disabled:opacity-50 ${styles.confirm}`}
        >
          {resolving ? 'Working…' : 'Confirm'}
        </button>
        <button
          onClick={handleReject}
          disabled={resolving}
          className="flex-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Picks the right rich card for a tool result, falls back to null (use default collapsible)
function RichToolResult({ tool, result }: { tool: string; result: string }) {
  if (tool === 'build_course' || tool === 'save_course') return <CourseCard result={result} />;
  if (tool === 'generate_videos') return <VideoProgressCard result={result} />;
  if (tool === 'analyze_document' || tool === 'apply_document_to_application') return <DocumentAnalysisCard result={result} />;
  return null;
}

function ToolCallBlock({ tc }: { tc: { tool: string; args: Record<string, unknown>; result: string } }) {
  const [open, setOpen] = useState(false);
  const meta = TOOL_META[tc.tool] ?? { label: tc.tool, color: 'text-slate-600', icon: Database };
  const Icon = meta.icon;
  let formatted = tc.result;
  try { formatted = JSON.stringify(JSON.parse(tc.result), null, 2); } catch { /* not JSON */ }

  const richCard = <RichToolResult tool={tc.tool} result={tc.result} />;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 text-xs overflow-hidden mb-2">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 transition-colors">
        {open
          ? <ChevronDown className={`w-3.5 h-3.5 ${meta.color}`} />
          : <ChevronRight className={`w-3.5 h-3.5 ${meta.color}`} />}
        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
        <span className={`font-semibold ${meta.color}`}>Used tool: {meta.label}</span>
        <span className="ml-auto text-slate-400 text-[10px] truncate max-w-7xl">
          {Object.keys(tc.args).length > 0 ? JSON.stringify(tc.args).slice(0, 60) : ''}
        </span>
      </button>
      {/* Rich inline card — shown without needing to expand */}
      {richCard && <div className="px-3 pb-3">{richCard}</div>}
      {/* Raw JSON fallback — only shown when expanded and no rich card */}
      {open && !richCard && (
        <pre className="px-3 pb-3 overflow-x-auto max-h-64 text-[11px] text-slate-700 bg-white border-t border-slate-200 leading-relaxed">
          {formatted}
        </pre>
      )}
      {/* Raw JSON toggle when rich card is present */}
      {richCard && open && (
        <pre className="px-3 pb-3 overflow-x-auto max-h-48 text-[11px] text-slate-500 bg-white border-t border-slate-200 leading-relaxed">
          {formatted}
        </pre>
      )}
    </div>
  );
}

export default function AIChat({ fileContext, onApplyCode, ellieMode = false }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [documentsContext, setDocumentsContext] = useState('');
  const [aiStatus, setAiStatus] = useState<'checking' | 'ready' | 'unconfigured'>('checking');
  const [aiProvider, setAiProvider] = useState<string>('');
  const [availableProviders, setAvailableProviders] = useState<Record<ProviderId, boolean>>({
    auto: true,
    groq: false,
    openai: false,
    anthropic: false,
    gemini: false,
  });
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('auto');
  const [selectedModel, setSelectedModel] = useState('auto');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function checkAi() {
      try {
        const res = await fetch('/api/devstudio/health');
        if (!res.ok) {
          setAiStatus('unconfigured');
          return;
        }
        const data = await res.json();
        const providers = {
          auto: true,
          groq: Boolean(data?.hasGroq ?? data?.availableProviders?.groq),
          openai: Boolean(data?.hasOpenAI ?? data?.availableProviders?.openai),
          anthropic: Boolean(data?.hasAnthropic ?? data?.availableProviders?.anthropic),
          gemini: Boolean(data?.hasGemini ?? data?.availableProviders?.gemini),
        };
        setAvailableProviders((prev) => ({ ...prev, ...providers }));
        const configured =
          data?.aiConfigured === true ||
          providers.groq ||
          providers.openai ||
          providers.anthropic ||
          providers.gemini;
        if (configured) {
          setAiStatus('ready');
          const names = [
            providers.groq && 'Groq',
            providers.openai && 'OpenAI',
            providers.anthropic && 'Anthropic',
            providers.gemini && 'Gemini',
          ].filter(Boolean);
          setAiProvider(names.join(' / ') || 'AI');
        } else {
          setAiStatus('unconfigured');
        }
      } catch {
        setAiStatus('unconfigured');
      }
    }
    checkAi();
  }, []);

  useEffect(() => {
    setSelectedModel(MODEL_OPTIONS[selectedProvider][0]);
  }, [selectedProvider]);

  useEffect(() => {
    let cancelled = false;
    async function loadDocs() {
      try {
        const res = await fetch('/api/devstudio/upload');
        if (!res.ok) return;
        const data = await res.json();
        const docs = (data.documents ?? []) as Array<{ name?: string; original_name?: string; content_type?: string; size_bytes?: number; created_at?: string }>;
        if (!docs.length) { if (!cancelled) setDocumentsContext(''); return; }
        const summary = docs.slice(0, 12).map((d, i) => {
          const date = d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : 'unknown';
          const size = typeof d.size_bytes === 'number' ? `${Math.round(d.size_bytes / 1024)}KB` : '?';
          return `${i + 1}. ${d.name || d.original_name || 'unnamed'} (${d.content_type || '?'}, ${size}, ${date})`;
        }).join('\n');
        if (!cancelled) setDocumentsContext(`Uploaded Dev Studio documents:\n${summary}`);
      } catch { if (!cancelled) setDocumentsContext(''); }
    }
    loadDocs();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Ellie ops mode — send approval/rejection decision to the approve endpoint
  const resolveEllieAction = async (msgIndex: number, action: EllieAction, decision: 'approve' | 'reject') => {
    // Immediately update the message to show a loading state on the card
    setMessages((prev) => prev.map((m, i) =>
      i === msgIndex ? { ...m, action: { ...action, label: decision === 'approve' ? 'Executing…' : 'Cancelling…' } } : m
    ));

    try {
      const res = await fetch('/api/admin/ai-assistant/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.id, decision }),
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

      const outcome: Message['actionOutcome'] = res.ok
        ? {
            status: decision === 'approve' ? (data.result?.success ? 'executed' : 'failed') : 'rejected',
            message: decision === 'approve'
              ? (data.result?.message ?? (data.result?.success ? 'Done.' : 'Action failed.'))
              : 'Cancelled.',
          }
        : { status: 'failed', message: data.error ?? 'Request failed.' };

      // Replace the action card with the outcome
      setMessages((prev) => prev.map((m, i) =>
        i === msgIndex ? { ...m, action: null, actionOutcome: outcome } : m
      ));
    } catch (err) {
      setMessages((prev) => prev.map((m, i) =>
        i === msgIndex ? { ...m, action: null, actionOutcome: { status: 'failed', message: err instanceof Error ? err.message : 'Unknown error' } } : m
      ));
    }
  };

  // Dev Studio code mode — unchanged
  const executeAction = async (action: NonNullable<Message['action']>) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/devstudio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action.type, params: action.params }),
      });
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      const result = res.ok
        ? `✅ ${action.label} completed.${data.message ? ` ${data.message}` : ''}`
        : `❌ Action failed: ${data.error ?? 'Unknown error'}`;
      setMessages((prev) => [...prev, { role: 'assistant', content: result }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `❌ Action failed: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // ── Ellie ops mode — uses ai-assistant endpoint (live data + actions) ──
    if (ellieMode) {
      try {
        const res = await fetch('/api/admin/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            sessionId: 'ellie-default',
            history: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        if (!res.ok) {
          setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${data.error ?? 'Request failed'}` }]);
          return;
        }
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.reply ?? '',
          // data.action is the full EllieAction shape (includes id from ellie_pending_actions)
          action: data.action ?? null,
        }]);
      } catch (err) {
        setMessages((prev) => [...prev, { role: 'assistant', content: `Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // ── Code AI mode — uses devstudio/chat SSE endpoint ──
    try {
      const res = await fetch('/api/devstudio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          fileContext,
          documentsContext,
          provider: selectedProvider,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${data.error ?? 'Request failed'}` }]);
        return;
      }

      // SSE streaming — add a placeholder message and update it token by token
      const placeholderIdx = newMessages.length; // index in the messages array
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer: string;
      buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const chunk = JSON.parse(line.slice(6));
              if (chunk.token !== undefined) {
                // Append token to the last assistant message
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: last.content + chunk.token };
                  }
                  return updated;
                });
              }
              if (chunk.done) {
                // Final frame — attach metadata
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      toolCalls: chunk.toolCalls ?? [],
                      provider: chunk.provider,
                      model: chunk.model,
                    };
                  }
                  return updated;
                });
                if (chunk.provider) {
                  setAiStatus('ready');
                  setAiProvider(chunk.model ? `${chunk.provider} · ${chunk.model}` : chunk.provider);
                }
                if (chunk.availableProviders) {
                  setAvailableProviders((prev) => ({ ...prev, ...chunk.availableProviders, auto: true }));
                }
              }
            } catch { /* malformed chunk — skip */ }
          }
        }
      }
      void placeholderIdx; // suppress unused warning
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Failed to connect: ${reason}` }]);
    } finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const extractCodeBlocks = (content: string) => {
    const rx = /```(\S+)?\n([\s\S]*?)```/g;
    const parts: { type: 'text' | 'code'; content: string; language?: string; filename?: string }[] = [];
    let last = 0; let m;
    while ((m = rx.exec(content)) !== null) {
      if (m.index > last) parts.push({ type: 'text', content: content.slice(last, m.index) });
      const tag = m[1] || '';
      const isFile = tag.includes('.') || tag.includes('/');
      parts.push({ type: 'code', content: m[2], language: isFile ? tag.split('.').pop() : tag, filename: isFile ? tag : undefined });
      last = m.index + m[0].length;
    }
    if (last < content.length) parts.push({ type: 'text', content: content.slice(last) });
    return parts.length ? parts : [{ type: 'text' as const, content }];
  };

  const QUICK = [
    'Show platform stats',
    'List all programs',
    'Show pending applications',
    'Build a course on HVAC fundamentals',
    'Generate videos for course ID …',
    'Analyze uploaded document',
    'List course blueprints',
    'Run git status',
  ];

  return (
    <div className="h-full min-h-0 flex flex-col bg-white">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50">
        <Sparkles className="w-4 h-4 text-brand-blue-600" />
        <span className="text-sm font-semibold text-slate-800">AI Platform Controller</span>
        <select
          value={selectedProvider}
          onChange={(e) => setSelectedProvider(e.target.value as ProviderId)}
          className="ml-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-brand-blue-500"
          aria-label="AI provider"
        >
          {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((provider) => (
            <option
              key={provider}
              value={provider}
              disabled={provider !== 'auto' && !availableProviders[provider]}
            >
              {PROVIDER_LABELS[provider]}{provider !== 'auto' && !availableProviders[provider] ? ' (not configured)' : ''}
            </option>
          ))}
        </select>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-brand-blue-500"
          aria-label="AI model"
        >
          {MODEL_OPTIONS[selectedProvider].map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-1.5">
          {aiStatus === 'checking' && <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
          {aiStatus === 'ready' && (
            <span className="flex items-center gap-1 text-xs text-brand-green-700">
              <span className="w-3.5 h-3.5 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" /> {aiProvider || 'AI'} ready
            </span>
          )}
          {aiStatus === 'unconfigured' && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" /> no AI key
            </span>
          )}
        </div>
      </div>

      {/* Unconfigured banner */}
      {aiStatus === 'unconfigured' && (
        <div className="flex-shrink-0 flex items-start gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-snug">
            <strong>AI not configured.</strong>{' '}
            {ellieMode ? (
              <>Add <code className="bg-amber-100 px-1 rounded">GROQ_API_KEY</code> or <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> in <Link href="/admin/integrations/env-manager" className="underline font-medium">Admin → Integrations → Environment Manager</Link>.</>
            ) : (
              <>Add <code className="bg-amber-100 px-1 rounded">GROQ_API_KEY</code> to <code className="bg-amber-100 px-1 rounded">.env.local</code> and restart the dev server.</>
            )}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="py-8">
            <div className="text-center mb-6">
              <Bot className="w-12 h-12 text-brand-blue-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-1">Ask me anything about the platform.</p>
              <p className="text-xs text-slate-400">I can query live data, explain code, generate courses, and more.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK.map((q) => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-full text-xs border border-slate-200 bg-white text-slate-600 hover:border-brand-blue-400 hover:bg-brand-blue-50 hover:text-brand-blue-700 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0 && (
                <div>{msg.toolCalls.map((tc, j) => <ToolCallBlock key={j} tc={tc} />)}</div>
              )}
              <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-brand-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-5/6 rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-brand-blue-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-800'}`}>
                  {msg.role === 'assistant' && msg.provider && (
                    <p className="mb-1 text-[10px] font-mono uppercase tracking-wide text-slate-400">
                      {msg.provider}{msg.model ? ` · ${msg.model}` : ''}
                    </p>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="space-y-2">
                      {extractCodeBlocks(msg.content).map((part, j) =>
                        part.type === 'code' ? (
                          <div key={j}>
                            <div className="flex items-center justify-between px-3 py-1 bg-slate-200 rounded-t border border-slate-300 border-b-0">
                              <span className="text-[11px] text-slate-600 font-mono">{part.filename || part.language || 'code'}</span>
                              <div className="flex gap-2 items-center">
                                {part.filename && onApplyCode && (
                                  <button onClick={() => onApplyCode(part.filename!, part.content)}
                                    className="text-[11px] text-brand-blue-600 hover:underline font-medium">Apply</button>
                                )}
                                <button onClick={() => copyCode(part.content, i * 100 + j)} className="text-slate-500 hover:text-slate-700">
                                  {copiedIndex === i * 100 + j
                                    ? <Check className="w-3 h-3 text-brand-green-600" />
                                    : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                            <pre className="px-3 py-2 rounded-b border border-slate-300 border-t-0 bg-white overflow-x-auto text-[12px] text-slate-800 font-mono leading-relaxed">
                              <code>{part.content}</code>
                            </pre>
                          </div>
                        ) : (
                          <p key={j} className="whitespace-pre-wrap leading-relaxed text-slate-800">{part.content}</p>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
              {/* Ellie approval card — staged action awaiting human confirm */}
              {msg.role === 'assistant' && msg.action && ellieMode && (
                <div className="ml-10 mt-2">
                  <EllieApprovalCard
                    action={msg.action}
                    onApprove={() => resolveEllieAction(i, msg.action!, 'approve')}
                    onReject={() => resolveEllieAction(i, msg.action!, 'reject')}
                  />
                </div>
              )}
              {/* Dev Studio action button (non-Ellie mode) */}
              {msg.role === 'assistant' && msg.action && !ellieMode && (
                <div className="ml-10 mt-2">
                  <button
                    onClick={() => executeAction(msg.action!)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {msg.action.label}
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Click to confirm and execute</p>
                </div>
              )}
              {/* Outcome badge — shown after approval/rejection */}
              {msg.role === 'assistant' && msg.actionOutcome && (
                <div className="ml-10 mt-2">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                    msg.actionOutcome.status === 'executed'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : msg.actionOutcome.status === 'rejected'
                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {msg.actionOutcome.status === 'executed' ? '✅' : msg.actionOutcome.status === 'rejected' ? '✕' : '❌'}
                    {msg.actionOutcome.message}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-brand-blue-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200">
              <Loader2 className="w-4 h-4 text-brand-blue-500 animate-spin" />
              <span className="text-sm text-slate-500">thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI anything — code, data, course gen… (Enter to send)"
            rows={3}
            className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 resize-y min-h-[80px] max-h-[35vh] focus:border-brand-blue-500 focus:outline-none"
          />
          <div className="flex flex-col gap-1.5">
            <label
              title="Upload file"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 cursor-pointer transition-colors"
            >
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.csv,.png,.jpg,.jpeg,.txt"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = '';

                  // Upload to admin documents bucket (triggers auto-OCR server-side)
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('category', 'dev-studio');

                  setMessages((prev) => [
                    ...prev,
                    { role: 'user', content: `[Uploading: ${file.name}…]` },
                  ]);

                  try {
                    const res = await fetch('/api/devstudio/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error ?? 'Upload failed');

                    // Replace the uploading placeholder with a real message + auto-analyze
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = {
                        role: 'user',
                        content: `[Uploaded: ${file.name}]${(data.document_id ?? data.id) ? `\n\nPlease analyze this document (ID: ${data.document_id ?? data.id}) and summarize what you find.` : ''}`,
                      };
                      return updated;
                    });

                    // If we got a document_id (admin/upload) or id (devstudio/upload), auto-send the analyze request
                    const docId = data.document_id ?? data.id;
                    if (docId) {
                      setIsLoading(true);
                      try {
                        const chatRes = await fetch('/api/devstudio/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            messages: [
                              ...messages.map((m) => ({ role: m.role, content: m.content })),
                              { role: 'user', content: `Analyze document ID: ${docId} (file: ${file.name})` },
                            ],
                            provider: selectedProvider,
                            model: selectedModel,
                          }),
                        });
                        const chatData = await chatRes.json();
                        if (!chatData.error) {
                          setMessages((prev) => [
                            ...prev,
                            {
                              role: 'assistant',
                              content: chatData.message,
                              toolCalls: chatData.toolCalls ?? [],
                              provider: chatData.provider,
                              model: chatData.model,
                            },
                          ]);
                        }
                      } finally { setIsLoading(false); }
                    }
                  } catch (err) {
                    const reason = err instanceof Error ? err.message : 'Upload failed';
                    setMessages((prev) => {
                      const updated = [...prev];
                      updated[updated.length - 1] = { role: 'user', content: `[Upload failed: ${reason}]` };
                      return updated;
                    });
                  }
                }}
              />
            </label>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-brand-blue-600 hover:bg-brand-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-400">
          Provider: {PROVIDER_LABELS[selectedProvider]} · Model: {selectedModel} · Enter to send · Shift+Enter for newline · 📎 to upload files
        </p>
      </div>
    </div>
  );
}
