'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Database,
  Download,
  Globe2,
  Keyboard,
  Loader2,
  MousePointer2,
  RefreshCw,
  Square,
} from 'lucide-react';
import type { OrchestratedPlanCheckpoint } from '@/lib/devstudio/ellie-unified-handlers';

type Session = {
  id: string;
  token: string;
  publicUrl: string;
  url: string;
  viewport: { width: number; height: number };
  expiresAt: string;
  conversationId?: string | null;
  taskId?: string | null;
};
type BrowserEvent = {
  type: string;
  at: string;
  level?: string;
  text?: string;
  url?: string;
  status?: number;
  error?: string;
};
type StudioDownload = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  status: 'downloading' | 'ready' | 'uploading' | 'stored' | 'failed';
  uploadProgress?: number;
  sourceUrl?: string;
  error?: string;
};

export default function CloudBrowserWorkspace({
  unifiedTask = null,
  conversationId = null,
  autoStart = false,
  initialTarget = '',
}: {
  unifiedTask?: OrchestratedPlanCheckpoint | null;
  conversationId?: string | null;
  autoStart?: boolean;
  initialTarget?: string;
}) {
  const [target, setTarget] = useState(initialTarget);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState('Ready to start');
  const [runtimeReady, setRuntimeReady] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<BrowserEvent[]>([]);
  const [downloads, setDownloads] = useState<StudioDownload[]>([]);
  const [envatoItemId, setEnvatoItemId] = useState('');
  const [licensedTitle, setLicensedTitle] = useState('');
  const [programTags, setProgramTags] = useState('');
  const [lessonTags, setLessonTags] = useState('');
  const [resolution, setResolution] = useState('3840x2160');
  const [storingDownload, setStoringDownload] = useState('');
  const [typedText, setTypedText] = useState('');
  const [agentTask, setAgentTask] = useState('');
  const [agentResult, setAgentResult] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState('');
  const [approvedTaskId, setApprovedTaskId] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);
  const secureInputRef = useRef<HTMLInputElement>(null);
  const targetEditedRef = useRef(Boolean(initialTarget));
  const autoStartedRef = useRef(false);

  const endpoint = session ? `${session.publicUrl}/sessions/${session.id}` : '';
  const authHeaders = session ? { Authorization: `Bearer ${session.token}` } : {};

  useEffect(() => {
    const requestedTarget = initialTarget.trim();
    if (!requestedTarget) return;
    targetEditedRef.current = true;
    autoStartedRef.current = false;
    setTarget(requestedTarget);
  }, [initialTarget]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/dev-studio/config', { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(payload.error || `Config failed (HTTP ${response.status})`);
        return payload;
      })
      .then((payload) => {
        if (cancelled || targetEditedRef.current) return;
        const configuredTarget =
          typeof payload.defaultPreviewUrl === 'string' ? payload.defaultPreviewUrl.trim() : '';
        setTarget(configuredTarget || `${window.location.origin}/dashboard`);
      })
      .catch(() => {
        if (!cancelled && !targetEditedRef.current) {
          setTarget(`${window.location.origin}/dashboard`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/dev-studio/browser/session', { cache: 'no-store' })
      .then(async (response) => {
        const raw = await response.text();
        let payload: Record<string, any> = {};
        try {
          payload = raw ? JSON.parse(raw) : {};
        } catch {
          payload = { error: raw.slice(0, 500) || `HTTP ${response.status}` };
        }
        return { response, payload };
      })
      .then(({ response, payload }) => {
        if (cancelled) return;
        const ready = response.ok && payload.configured === true && payload.ready === true;
        setRuntimeReady(ready);
        setStatus(
          ready
            ? 'Ready to start'
            : !response.ok
              ? `Runtime check failed (HTTP ${response.status})`
              : payload.configured
                ? 'Runtime is offline'
                : 'Runtime is not configured',
        );
        if (!ready) {
          setError(
            payload.error ||
              (payload.configured
                ? 'The isolated browser service is configured but is not responding.'
                : 'Configure STUDIO_BROWSER_URL, STUDIO_BROWSER_PUBLIC_URL, and STUDIO_BROWSER_SECRET in Containers before starting Chromium.'),
          );
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setRuntimeReady(false);
          setStatus('Runtime check failed');
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not verify the isolated browser runtime.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function start() {
    setError('');
    setStatus('Starting isolated Chromium…');
    const response = await fetch('/api/admin/dev-studio/browser/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: target,
        width: 1440,
        height: 900,
        conversationId: conversationId || undefined,
        taskId: unifiedTask?.taskId || undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Could not start browser');
      setStatus('Unavailable');
      return;
    }
    setSession(payload);
    if (conversationId && payload.conversationId && payload.conversationId !== conversationId) {
      setSession(null);
      setError('Browser session context did not match the active LIZZY conversation.');
      setStatus('Unavailable');
      return;
    }
    setStatus('Connected');
  }

  useEffect(() => {
    if (
      !autoStart ||
      runtimeReady !== true ||
      !target.trim() ||
      session ||
      autoStartedRef.current
    ) {
      return;
    }
    autoStartedRef.current = true;
    void start().catch((cause) => {
      autoStartedRef.current = false;
      setError(cause instanceof Error ? cause.message : 'Could not start browser');
      setStatus('Unavailable');
    });
    // start uses the active conversation and checkpoint identity captured by this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, runtimeReady, session, target, conversationId, unifiedTask?.taskId]);

  async function action(payload: Record<string, unknown>) {
    if (!session) return;
    const response = await fetch(`${endpoint}/actions`, {
      method: 'POST',
      headers: { ...authHeaders, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || 'Browser action failed');
    else if (body.url) setTarget(body.url);
  }

  async function storeLicensedDownload(download: StudioDownload) {
    if (!session || download.status !== 'ready') return;
    if (!envatoItemId.trim()) {
      setError('Enter the Envato item ID before saving this licensed file.');
      return;
    }
    setError('');
    setStoringDownload(download.id);
    const common = {
      title: licensedTitle.trim() || download.fileName.replace(/\.[^.]+$/, ''),
      fileName: download.fileName,
      fileType: download.contentType,
      fileSize: download.size,
      provider: 'envato',
      providerItemId: envatoItemId.trim(),
      sourceUrl: download.sourceUrl || target,
      resolution: resolution.trim(),
      programTags: programTags
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      lessonTags: lessonTags
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    };
    try {
      const prepareResponse = await fetch('/api/admin/videos/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'prepare-library', ...common }),
      });
      const prepared = await prepareResponse.json().catch(() => ({}));
      if (
        !prepareResponse.ok ||
        !prepared.bucket ||
        !prepared.storagePath ||
        !prepared.token ||
        !prepared.uploadEndpoint
      )
        throw new Error(prepared.error || 'Could not prepare private course-media storage.');
      const importResponse = await fetch(`${endpoint}/imports`, {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({
          downloadId: download.id,
          endpoint: prepared.uploadEndpoint,
          bucket: prepared.bucket,
          storagePath: prepared.storagePath,
          token: prepared.token,
        }),
      });
      const imported = await importResponse.json().catch(() => ({}));
      if (!importResponse.ok || !imported.ok)
        throw new Error(imported.error || 'The browser download could not be stored.');
      const finalizeResponse = await fetch('/api/admin/videos/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize-library',
          storagePath: prepared.storagePath,
          ...common,
        }),
      });
      const finalized = await finalizeResponse.json().catch(() => ({}));
      if (!finalizeResponse.ok || !finalized.success)
        throw new Error(finalized.error || 'The stored media could not be indexed.');
      setStatus('Licensed media stored securely');
      setEnvatoItemId('');
      setLicensedTitle('');
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'The licensed download could not be stored.',
      );
    } finally {
      setStoringDownload('');
    }
  }

  async function stop() {
    if (activeTaskId) {
      await fetch(`/api/admin/dev-studio/tasks/${activeTaskId}/cancel`, { method: 'POST' }).catch(
        () => undefined,
      );
    }
    if (session)
      await fetch(endpoint, { method: 'DELETE', headers: authHeaders }).catch(() => undefined);
    setSession(null);
    setEvents([]);
    setDownloads([]);
    setStatus('Stopped');
    setActiveTaskId('');
  }

  async function runAgent(taskId = '') {
    if (!session || !agentTask.trim()) return;
    if (!taskId) setActiveTaskId('');
    setAgentRunning(true);
    setAgentResult('');
    setError('');
    setApprovalRequested(false);
    try {
      const response = await fetch('/api/admin/dev-studio/browser/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          task: agentTask,
          sessionId: session.id,
          sessionToken: session.token,
          taskId: taskId || undefined,
          conversationId: conversationId || undefined,
        }),
      });
      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 409 && payload.approvalRequired) {
          setActiveTaskId(payload.taskId || '');
          setApprovalRequested(true);
          setError(payload.confirmation || payload.error);
          return;
        }
        throw new Error(payload.error || 'AI browser task failed');
      }
      const canonicalTaskId = response.headers.get('x-studio-task-id') || '';
      if (!canonicalTaskId) throw new Error('AI browser task response is missing its canonical ID');
      setActiveTaskId(canonicalTaskId);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let completed = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const raw = chunk
            .split('\n')
            .find((line) => line.startsWith('data: '))
            ?.slice(6);
          if (!raw) continue;
          const event = JSON.parse(raw);
          if (event.taskId && event.taskId !== canonicalTaskId) {
            throw new Error('AI browser task identity changed during execution');
          }
          if (event.type === 'status' || event.type === 'step') setStatus(event.message);
          if (event.type === 'done') {
            completed = true;
            setAgentResult(event.output || `Completed ${event.steps?.length || 0} browser steps.`);
            setStatus('Connected');
          }
          if (event.type === 'error') throw new Error(event.error || 'AI browser task failed');
        }
      }
      if (!completed) throw new Error('AI browser task ended without a result');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI browser task failed');
    } finally {
      setAgentRunning(false);
    }
  }

  async function approveAndResume() {
    if (!activeTaskId) return;
    setAgentRunning(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/dev-studio/tasks/${activeTaskId}/approve`, {
        method: 'POST',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not approve browser task');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not approve browser task');
      setAgentRunning(false);
      return;
    }
    setAgentRunning(false);
    await runAgent(activeTaskId);
  }

  useEffect(() => {
    const receiveApproval = (event: Event) => {
      const taskId = (event as CustomEvent<{ taskId?: string }>).detail?.taskId;
      if (taskId && taskId === activeTaskId) setApprovedTaskId(taskId);
    };
    window.addEventListener('studio:task-approved', receiveApproval);
    return () => window.removeEventListener('studio:task-approved', receiveApproval);
  }, [activeTaskId]);

  useEffect(() => {
    if (!approvedTaskId || approvedTaskId !== activeTaskId || !approvalRequested) return;
    setApprovedTaskId('');
    void runAgent(activeTaskId);
    // runAgent intentionally resumes the exact persisted task after the inline approval event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvedTaskId]);

  useEffect(() => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.token}` };
    const timer = window.setInterval(
      async () => {
        const response = await fetch(`${endpoint}/events`, { headers }).catch(() => null);
        if (response?.ok) {
          const payload = await response.json();
          setEvents(payload.events || []);
          if (payload.url) setTarget(payload.url);
        }
        const downloadsResponse = await fetch(`${endpoint}/downloads`, { headers }).catch(
          () => null,
        );
        if (downloadsResponse?.ok) {
          const payload = await downloadsResponse.json();
          setDownloads(payload.downloads || []);
        }
      },
      agentRunning ? 1000 : 3000,
    );
    return () => window.clearInterval(timer);
  }, [agentRunning, endpoint, session]);

  useEffect(() => {
    if (!session) return;
    const token = session.token;
    return () => {
      void fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      });
    };
  }, [endpoint, session]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-950 text-white">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 p-3">
        <Globe2 className="h-5 w-5 text-cyan-300" />
        <strong className="mr-2">Cloud Browser</strong>
        <input
          value={target}
          onChange={(event) => {
            targetEditedRef.current = true;
            setTarget(event.target.value);
          }}
          className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          aria-label="Browser URL"
        />
        {!session ? (
          <button
            onClick={start}
            disabled={runtimeReady !== true || !target.trim()}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Chromium
          </button>
        ) : (
          <>
            <button
              onClick={() => action({ type: 'navigate', url: target })}
              className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-black text-slate-950"
            >
              Go
            </button>
            <button
              onClick={() => action({ type: 'reload' })}
              className="rounded-lg border border-slate-700 p-2"
              title="Reload"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={stop}
              className="rounded-lg border border-rose-800 p-2 text-rose-300"
              title="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          </>
        )}
        <span className="text-[11px] text-slate-400">{status}</span>
        {unifiedTask ? (
          <span className="max-w-full truncate rounded-full border border-violet-500/50 bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-200">
            LIZZY conversation · {unifiedTask.title || unifiedTask.planId}
          </span>
        ) : null}
      </header>
      {error && (
        <div className="flex items-center gap-2 border-b border-rose-900 bg-rose-950/60 px-3 py-2 text-xs text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative flex min-h-0 items-center justify-center overflow-hidden bg-slate-800">
          {session ? (
            <img
              ref={imageRef}
              src={`${endpoint}/stream?token=${encodeURIComponent(session.token)}`}
              alt="Live isolated Chromium browser"
              referrerPolicy="no-referrer"
              draggable={false}
              className="h-full w-full cursor-crosshair select-none bg-white object-contain shadow-2xl"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                void action({
                  type: 'click',
                  x: Math.round(
                    ((event.clientX - rect.left) * session.viewport.width) / rect.width,
                  ),
                  y: Math.round(
                    ((event.clientY - rect.top) * session.viewport.height) / rect.height,
                  ),
                });
              }}
              onWheel={(event) => {
                event.preventDefault();
                void action({ type: 'scroll', deltaX: event.deltaX, deltaY: event.deltaY });
              }}
            />
          ) : (
            <div className="text-center text-slate-400">
              <Loader2 className="mx-auto mb-3 h-8 w-8" />
              <p>Start the isolated open-source browser to inspect the live platform.</p>
            </div>
          )}
        </div>
        <aside className="hidden min-h-0 flex-col border-l border-slate-800 bg-slate-950 lg:flex">
          <div className="border-b border-slate-800 p-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-black text-cyan-300">
              <Download className="h-4 w-4" /> Envato licensed downloads
            </p>
            <p className="mb-2 text-[10px] leading-4 text-slate-500">
              Download inside this browser, then store the finished 4K file directly in the private
              Course Builder library.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={envatoItemId}
                onChange={(event) => setEnvatoItemId(event.target.value)}
                placeholder="Envato item ID"
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                placeholder="Resolution"
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                value={licensedTitle}
                onChange={(event) => setLicensedTitle(event.target.value)}
                placeholder="Asset title"
                className="col-span-2 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                value={programTags}
                onChange={(event) => setProgramTags(event.target.value)}
                placeholder="Programs: barber, hvac"
                className="col-span-2 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
              />
              <input
                value={lessonTags}
                onChange={(event) => setLessonTags(event.target.value)}
                placeholder="Lesson tags, comma separated"
                className="col-span-2 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
              />
            </div>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {downloads.map((download) => (
                <div
                  key={download.id}
                  className="rounded border border-slate-800 bg-slate-900 p-2 text-[10px]"
                >
                  <p className="truncate font-bold text-white">{download.fileName}</p>
                  <p className="text-slate-400">
                    {download.status} ·{' '}
                    {download.size ? `${Math.round(download.size / 1048576)} MB` : 'preparing'}
                    {download.status === 'uploading' ? ` · ${download.uploadProgress || 0}%` : ''}
                  </p>
                  {download.error ? <p className="text-rose-300">{download.error}</p> : null}
                  {download.status === 'ready' ? (
                    <button
                      onClick={() => storeLicensedDownload(download)}
                      disabled={Boolean(storingDownload)}
                      className="mt-1 flex w-full items-center justify-center gap-1 rounded bg-emerald-600 px-2 py-1 font-black text-white disabled:opacity-50"
                    >
                      <Database className="h-3 w-3" />{' '}
                      {storingDownload === download.id ? 'Storing…' : 'Save to Course Builder'}
                    </button>
                  ) : null}
                </div>
              ))}
              {!downloads.length ? (
                <p className="text-[10px] text-slate-500">No browser downloads yet.</p>
              ) : null}
            </div>
          </div>
          <div className="border-b border-slate-800 p-3">
            <p className="mb-1 text-xs font-black text-violet-300">LIZZY Browser Task</p>
            <p className="mb-2 text-[10px] text-slate-500">
              Runs as a tool in this LIZZY conversation. Progress, approvals, evidence, and results
              appear in the conversation timeline.
            </p>
            {activeTaskId && (
              <p className="mb-2 block truncate rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-cyan-300">
                Task evidence: {activeTaskId}
              </p>
            )}
            <textarea
              value={agentTask}
              onChange={(event) => setAgentTask(event.target.value)}
              rows={3}
              placeholder="Example: inspect every navigation link and report failures"
              className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs"
            />
            <button
              onClick={() => runAgent()}
              disabled={!session || !agentTask.trim() || agentRunning}
              className="mt-2 w-full rounded bg-violet-600 px-3 py-2 text-xs font-black disabled:opacity-50"
            >
              {agentRunning ? 'Running approved task…' : 'Run AI browser task'}
            </button>
            {approvalRequested && (
              <button
                onClick={approveAndResume}
                disabled={agentRunning}
                className="mt-2 w-full rounded bg-amber-500 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-50"
              >
                Approve canonical task and resume
              </button>
            )}
            {agentResult && (
              <p className="mt-2 rounded bg-slate-900 p-2 text-[10px] text-slate-300">
                {agentResult}
              </p>
            )}
          </div>
          <div className="border-b border-slate-800 p-3">
            <p className="mb-2 text-xs font-black text-emerald-300">Secure sign-in handoff</p>
            <p className="mb-2 text-[10px] leading-4 text-slate-500">
              Enter passwords or verification codes here. The value is sent directly to the active
              isolated browser, cleared immediately, and never added to the AI conversation or task
              evidence.
            </p>
            <div className="flex gap-2">
              <input
                ref={secureInputRef}
                type="password"
                autoComplete="off"
                aria-label="Secure browser input"
                className="min-w-0 flex-1 rounded border border-emerald-800 bg-slate-900 px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const value = secureInputRef.current?.value || '';
                  if (!value || !session) return;
                  if (secureInputRef.current) secureInputRef.current.value = '';
                  void action({ type: 'type', text: value });
                }}
                disabled={!session}
                className="rounded bg-emerald-600 px-2 text-xs font-black text-white disabled:opacity-50"
              >
                Type securely
              </button>
              <button
                type="button"
                onClick={() => action({ type: 'keypress', key: 'Enter' })}
                disabled={!session}
                className="rounded border border-emerald-800 px-2 text-xs text-emerald-200 disabled:opacity-50"
              >
                Enter
              </button>
            </div>
          </div>
          <div className="border-b border-slate-800 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-black">
              <Keyboard className="h-4 w-4" /> Keyboard input
            </p>
            <div className="flex gap-2">
              <input
                value={typedText}
                onChange={(event) => setTypedText(event.target.value)}
                className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
              />
              <button
                onClick={() => {
                  void action({ type: 'type', text: typedText });
                  setTypedText('');
                }}
                disabled={!session}
                className="rounded bg-slate-700 px-2 text-xs"
              >
                Type
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              {['Enter', 'Tab', 'Escape', 'Backspace'].map((key) => (
                <button
                  key={key}
                  onClick={() => action({ type: 'keypress', key })}
                  disabled={!session}
                  className="rounded border border-slate-700 px-2 py-1 text-[10px]"
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-black">
              <MousePointer2 className="h-4 w-4" /> Browser evidence
            </p>
            {events.length ? (
              events
                .slice(-100)
                .reverse()
                .map((item, index) => (
                  <div
                    key={`${item.at}-${index}`}
                    className="mb-2 rounded border border-slate-800 bg-slate-900 p-2 text-[10px]"
                  >
                    <span className="font-bold text-cyan-300">{item.type}</span>{' '}
                    <span className="text-slate-500">{item.at}</span>
                    <p className="mt-1 break-all text-slate-300">
                      {item.text || item.error || `${item.status || ''} ${item.url || ''}`}
                    </p>
                  </div>
                ))
            ) : (
              <p className="text-xs text-slate-500">
                Console errors, failed requests, and HTTP failures will appear here.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
