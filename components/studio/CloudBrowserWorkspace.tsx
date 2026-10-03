'use client';

import { useEffect, useId, useRef, useState } from 'react';
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
  status: 'downloading' | 'normalizing' | 'ready' | 'uploading' | 'stored' | 'failed';
  durationSeconds?: number;
  resolution?: string;
  uploadProgress?: number;
  sourceUrl?: string;
  error?: string;
};

export default function CloudBrowserWorkspace({
  unifiedTask = null,
  conversationId = null,
  autoStart = false,
  initialTarget = '',
  initialTask = '',
  autoRunTask = false,
  acquisitionRunId = '',
}: {
  unifiedTask?: OrchestratedPlanCheckpoint | null;
  conversationId?: string | null;
  autoStart?: boolean;
  initialTarget?: string;
  initialTask?: string;
  autoRunTask?: boolean;
  acquisitionRunId?: string;
}) {
  const secureInputId = useId();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const reconnectingRef = useRef(false);
  const launchTargetRef = useRef(initialTarget);
  const lifecycleRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggedRef = useRef(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [signInView, setSignInView] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'browser' | 'tools'>('browser');
  const [target, setTarget] = useState(initialTarget);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState('Ready to start');
  const [runtimeReady, setRuntimeReady] = useState<boolean | null>(null);
  const [checkingBrowser, setCheckingBrowser] = useState(false);
  const [foundationChecks, setFoundationChecks] = useState<
    { name: string; passed: boolean; reason?: string }[]
  >([]);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<BrowserEvent[]>([]);
  const [browserTabs, setBrowserTabs] = useState<{ id: string; url: string }[]>([]);
  const [activeTabId, setActiveTabId] = useState('');
  const [filePicker, setFilePicker] = useState(false);
  const [browserDialog, setBrowserDialog] = useState<{
    type: string;
    message: string;
  } | null>(null);
  const [dialogText, setDialogText] = useState('');
  const [uploading, setUploading] = useState(false);
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
  const [authenticationRequired, setAuthenticationRequired] = useState(false);
  const [interactionRequired, setInteractionRequired] = useState(false);
  const [continuationTaskId, setContinuationTaskId] = useState('');
  const [activeTaskId, setActiveTaskId] = useState('');
  const [approvedTaskId, setApprovedTaskId] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);
  const secureInputRef = useRef<HTMLInputElement>(null);
  const actionQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const [secureInputKind, setSecureInputKind] = useState<'email' | 'password'>('email');
  const [replaceSecureInput, setReplaceSecureInput] = useState(true);
  const [sendingSecureInput, setSendingSecureInput] = useState(false);
  const targetEditedRef = useRef(Boolean(initialTarget));
  const targetDraftRef = useRef<string | null>(null);
  const navigationRevisionRef = useRef(0);
  const navigatingRef = useRef(false);
  const autoStartedRef = useRef(false);
  const autoRunCommandRef = useRef('');

  const endpoint = session ? `${session.publicUrl}/sessions/${session.id}` : '';
  const authHeaders: Record<string, string> = session
    ? { Authorization: `Bearer ${session.token}` }
    : {};

  useEffect(() => {
    const requestedTarget = initialTarget.trim();
    if (!requestedTarget) return;
    targetEditedRef.current = true;
    targetDraftRef.current = requestedTarget;
    navigationRevisionRef.current += 1;
    autoStartedRef.current = false;
    setTarget(requestedTarget);
  }, [initialTarget]);

  useEffect(() => {
    const requestedTask = initialTask.trim();
    if (!requestedTask) return;
    setAgentTask(requestedTask);
    if (autoRunCommandRef.current !== requestedTask) autoRunCommandRef.current = '';
  }, [initialTask]);

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
        setTarget(configuredTarget || '');
      })
      .catch(() => {
        if (!cancelled && !targetEditedRef.current) {
          setTarget('');
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

  async function verifyBrowser() {
    setCheckingBrowser(true);
    setFoundationChecks([]);
    setError('');
    try {
      const response = await fetch('/api/admin/dev-studio/browser/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      const evidence = await response.json();
      setFoundationChecks(evidence.checks || []);
      if (!response.ok || evidence.passed !== true)
        setError(
          evidence.error || 'Live browser acceptance did not pass. See the failed check below.',
        );
    } catch {
      setError('Live browser acceptance could not finish.');
    } finally {
      setCheckingBrowser(false);
    }
  }

  async function start(overrideTarget = target, compact = false) {
    const lifecycle = ++lifecycleRef.current;
    const startingTarget = overrideTarget;
    launchTargetRef.current = startingTarget;
    setError('');
    setStatus('Starting isolated Chromium…');
    const response = await fetch('/api/admin/dev-studio/browser/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: startingTarget,
        width: compact ? 390 : Math.min(1440, Math.max(390, window.innerWidth)),
        height: compact || window.innerWidth < 1024 ? 780 : 900,
        conversationId: conversationId || undefined,
        taskId: unifiedTask?.taskId || undefined,
      }),
    });
    const payload = await response.json();
    if (lifecycle !== lifecycleRef.current) return;
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
    if (targetDraftRef.current === null || targetDraftRef.current === startingTarget) {
      targetDraftRef.current = null;
      if (payload.url) setTarget(payload.url);
    }
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

  async function openSignIn() {
    setSignInView(true);
    setMobilePane('browser');
    setControlsOpen(false);
    if (session) await action({ type: 'viewport', width: 390, height: 780 });
    else if (runtimeReady === true && target.trim()) await start(target, true);
    else {
      setControlsOpen(true);
      setError('Enter the website address and start the browser before signing in.');
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!session || !files?.length) return;
    setUploading(true);
    setError('');
    try {
      if (files.length > 10) throw new Error('Choose at most 10 files per upload.');
      const ids: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 32 * 1024 * 1024) throw new Error('Each upload must be at most 32 MB.');
        const response = await fetch(`${endpoint}/uploads`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            'content-type': 'application/octet-stream',
            'x-studio-file-name': encodeURIComponent(file.name),
          },
          body: file,
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Browser upload failed');
        ids.push(body.id);
      }
      if (await action({ type: 'choose_files', fileIds: ids })) setFilePicker(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Browser upload failed');
    } finally {
      setUploading(false);
    }
  }

  function action(payload: Record<string, unknown>): Promise<boolean> {
    // Keep clicks, text and submission in the user's order, even on a slow connection.
    const queued = actionQueueRef.current.catch(() => undefined).then(() => performAction(payload));
    actionQueueRef.current = queued;
    return queued;
  }

  async function performAction(payload: Record<string, unknown>): Promise<boolean> {
    if (!session) return false;
    const navigation = payload.type === 'navigate';
    if (
      navigation &&
      typeof payload.url === 'string' &&
      !payload.url.includes('accounts.google.com')
    )
      launchTargetRef.current = payload.url;
    const revision = navigation ? ++navigationRevisionRef.current : navigationRevisionRef.current;
    if (navigation) navigatingRef.current = true;
    try {
      const response = await fetch(`${endpoint}/actions`, {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(body.error || 'Browser action failed');
        return false;
      }
      if (body.viewport)
        setSession((current) => (current ? { ...current, viewport: body.viewport } : current));
      if (navigationRevisionRef.current === revision) {
        if (navigation) targetDraftRef.current = null;
        if (body.url && targetDraftRef.current === null) setTarget(body.url);
      }
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Browser action failed');
      return false;
    } finally {
      if (navigation && navigationRevisionRef.current === revision) navigatingRef.current = false;
    }
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
      resolution: download.resolution || resolution.trim(),
      durationSeconds: download.durationSeconds,
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
    lifecycleRef.current += 1;
    if (activeTaskId) {
      await fetch(`/api/admin/dev-studio/tasks/${activeTaskId}/cancel`, {
        method: 'POST',
      }).catch(() => undefined);
    }
    if (session)
      await fetch(endpoint, { method: 'DELETE', headers: authHeaders }).catch(() => undefined);
    setSession(null);
    setEvents([]);
    setDownloads([]);
    setStatus('Stopped');
    setActiveTaskId('');
    setContinuationTaskId('');
  }

  async function runAgent(taskId = '', taskOverride = '') {
    const command = taskOverride.trim() || agentTask.trim();
    if (!session || !command) return;
    if (!taskId) setActiveTaskId('');
    setAgentRunning(true);
    setAgentResult('');
    setError('');
    setApprovalRequested(false);
    setAuthenticationRequired(false);
    setInteractionRequired(false);
    try {
      const response = await fetch('/api/admin/dev-studio/browser/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          task: command,
          sessionId: session.id,
          sessionToken: session.token,
          taskId: taskId || undefined,
          conversationId: conversationId || undefined,
          acquisitionRunId: acquisitionRunId || undefined,
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
      let settled = false;
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
          if (event.type === 'continue') {
            settled = true;
            setStatus(event.message);
            setContinuationTaskId(canonicalTaskId);
          }
          if (event.type === 'done') {
            settled = true;
            setAgentResult(event.output || `Completed ${event.steps?.length || 0} browser steps.`);
            setStatus('Connected');
          }
          if (event.type === 'interaction_required') {
            settled = true;
            setInteractionRequired(true);
            setStatus('Browser response required');
            setError(event.message);
          }
          if (event.type === 'authentication_required') {
            settled = true;
            setAuthenticationRequired(true);
            setStatus('Secure sign-in required');
            setError(
              event.message ||
                'Sign in in the isolated browser, then press Enter to resume this same task.',
            );
          }
          if (event.type === 'error') throw new Error(event.error || 'AI browser task failed');
        }
      }
      if (!settled) throw new Error('AI browser task ended without a result');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'AI browser task failed');
    } finally {
      setAgentRunning(false);
    }
  }

  useEffect(() => {
    if (!continuationTaskId || agentRunning || !session || continuationTaskId !== activeTaskId)
      return;
    const taskId = continuationTaskId;
    setContinuationTaskId('');
    void runAgent(taskId);
    // Resume the same canonical checkpoint; do not create a second task.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [continuationTaskId, agentRunning, session, activeTaskId]);

  async function sendSecureInput() {
    const input = secureInputRef.current;
    const value = input?.value || '';
    if (!input || !value || !session || sendingSecureInput) return;
    input.value = '';
    setSendingSecureInput(true);
    try {
      await action(
        replaceSecureInput
          ? {
              actions: [
                { type: 'keypress', key: 'ControlOrMeta+A' },
                { type: 'type', text: value },
              ],
            }
          : { type: 'type', text: value },
      );
    } finally {
      setSendingSecureInput(false);
    }
  }

  async function submitBrowserEnter() {
    // Email submission is only the first login step; do not restart the agent
    // while the administrator is still entering a password or verification code.
    await action({ type: 'keypress', key: 'Enter' });
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
    const requestedTask = initialTask.trim();
    if (
      !autoRunTask ||
      !session ||
      !requestedTask ||
      agentRunning ||
      autoRunCommandRef.current === requestedTask
    )
      return;
    autoRunCommandRef.current = requestedTask;
    setAgentTask(requestedTask);
    void runAgent('', requestedTask);
    // runAgent uses the current isolated session and exact command supplied by Studio chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRunTask, session, initialTask]);

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
        const revision = navigationRevisionRef.current;
        const response = await fetch(`${endpoint}/events`, { headers }).catch(() => null);
        if (response?.status === 410 && !reconnectingRef.current) {
          reconnectingRef.current = true;
          const reconnectTarget = target.includes('accounts.google.com')
            ? launchTargetRef.current
            : target;
          setSession(null);
          setStatus('Reconnecting the existing browser account…');
          try {
            await start(reconnectTarget);
            if (activeTaskId) setContinuationTaskId(activeTaskId);
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Browser reconnect failed');
          } finally {
            reconnectingRef.current = false;
          }
          return;
        }
        if (response?.ok) {
          const payload = await response.json();
          setEvents(payload.events || []);
          if (payload.viewport)
            setSession((current) =>
              current &&
              (current.viewport.width !== payload.viewport.width ||
                current.viewport.height !== payload.viewport.height)
                ? { ...current, viewport: payload.viewport }
                : current,
            );
          setBrowserTabs(payload.tabs || []);
          setActiveTabId(payload.activeTabId || '');
          setFilePicker(Boolean(payload.filePicker));
          setBrowserDialog(payload.dialog || null);
          if (
            payload.url &&
            targetDraftRef.current === null &&
            !navigatingRef.current &&
            revision === navigationRevisionRef.current
          )
            setTarget(payload.url);
        }
        const downloadsResponse = await fetch(`${endpoint}/downloads`, {
          headers,
        }).catch(() => null);
        if (downloadsResponse?.ok) {
          const payload = await downloadsResponse.json();
          setDownloads(payload.downloads || []);
        }
      },
      agentRunning ? 1000 : 3000,
    );
    return () => window.clearInterval(timer);
    // Polling reconnects the verified account and exact existing task after worker restart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentRunning, endpoint, session, activeTaskId]);

  // Page navigation detaches the view, not the shared provider session.
  // Explicit Stop and the worker TTL own session cleanup.

  return (
    <div ref={workspaceRef} className="flex h-full min-h-0 flex-col bg-white text-lg leading-7 text-slate-950">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white p-2">
        <strong className="flex-1 text-lg">Studio browser</strong>
        <button type="button" onClick={() => void openSignIn()} aria-pressed={signInView}
          className="min-h-12 rounded-lg bg-emerald-700 px-4 text-lg font-bold text-white">
          Sign in
        </button>
        <button type="button" aria-expanded={controlsOpen} onClick={() => setControlsOpen(!controlsOpen)}
          className="min-h-12 rounded-lg border border-slate-300 px-3 text-base">
          Browser controls
        </button>
        {signInView ? <button type="button" onClick={() => setSignInView(false)}
          className="min-h-12 rounded-lg border border-slate-300 px-3 text-base">Exit sign-in view</button> : null}
      </div>
      {session ? (
        <div role="toolbar" aria-label="Browser view controls" className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-2 py-1">
          <button type="button" aria-label="Zoom browser out" disabled={imageZoom <= 1}
            onClick={() => setImageZoom((zoom) => Math.max(1, zoom - 0.5))}
            className="min-h-11 min-w-11 rounded border border-slate-300 text-xl disabled:opacity-40">−</button>
          <output aria-label="Browser zoom" className="min-w-12 text-center text-base">{Math.round(imageZoom * 100)}%</output>
          <button type="button" aria-label="Zoom browser in" disabled={imageZoom >= 3}
            onClick={() => setImageZoom((zoom) => Math.min(3, zoom + 0.5))}
            className="min-h-11 min-w-11 rounded border border-slate-300 text-xl disabled:opacity-40">+</button>
          <button type="button" aria-label="Scroll website up" onClick={() => void action({ type: 'scroll', deltaX: 0, deltaY: -400 })}
            className="min-h-11 min-w-11 rounded border border-slate-300 px-3 text-base">↑</button>
          <button type="button" aria-label="Scroll website down" onClick={() => void action({ type: 'scroll', deltaX: 0, deltaY: 400 })}
            className="min-h-11 min-w-11 rounded border border-slate-300 px-3 text-base">↓</button>
        </div>
      ) : null}
      <header className={`${controlsOpen || !session ? 'flex' : 'hidden'} max-h-[30dvh] shrink-0 flex-wrap items-center gap-2 overflow-y-auto border-b border-slate-200 bg-slate-50 p-3`}>
        <Globe2 className="h-5 w-5 text-cyan-800" />
        <strong className="mr-2">Cloud Browser</strong>
        <button
          onClick={() => void verifyBrowser()}
          disabled={checkingBrowser || runtimeReady !== true}
          className="min-h-12 rounded-lg border border-slate-300 px-3 text-sm"
        >
          {checkingBrowser ? 'Checking live browser…' : 'Run browser check'}
        </button>
        <input
          value={target}
          onChange={(event) => {
            targetEditedRef.current = true;
            targetDraftRef.current = event.target.value;
            navigationRevisionRef.current += 1;
            navigatingRef.current = false;
            setTarget(event.target.value);
          }}
          className="min-h-12 min-w-0 basis-full flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base lg:basis-auto"
          aria-label="Browser URL"
        />
        {!session ? (
          <button
            onClick={() => void start()}
            disabled={runtimeReady !== true || !target.trim()}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start Chromium
          </button>
        ) : (
          <>
            <button
              aria-label="Back"
              onClick={() => action({ type: 'back' })}
              className="min-h-12 rounded-lg border border-slate-300 px-3"
            >
              ←
            </button>
            <button
              aria-label="Forward"
              onClick={() => action({ type: 'forward' })}
              className="min-h-12 rounded-lg border border-slate-300 px-3"
            >
              →
            </button>
            <button
              onClick={() => action({ type: 'navigate', url: target })}
              className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-black text-slate-950"
            >
              Go
            </button>
            <button
              onClick={() => action({ type: 'reload' })}
              className="rounded-lg border border-slate-300 p-2"
              title="Reload"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={stop}
              className="rounded-lg border border-rose-300 p-2 text-rose-700"
              title="Stop"
            >
              <Square className="h-4 w-4" />
            </button>
          </>
        )}
        {session ? (
          <>
            <button
              onClick={() => action({ type: 'viewport', width: 390, height: 780 })}
              className="min-h-12 rounded-lg border border-slate-300 px-3 text-sm"
            >
              Mobile view
            </button>
            <button
              onClick={() => action({ type: 'viewport', width: 1280, height: 900 })}
              className="min-h-12 rounded-lg border border-slate-300 px-3 text-sm"
            >
              Desktop view
            </button>
            <button
              onClick={() => {
                const request = document.fullscreenElement
                  ? document.exitFullscreen()
                  : workspaceRef.current?.requestFullscreen();
                void request?.catch(() =>
                  setError(
                    'Full screen is not supported in this browser. Use Mobile view for larger controls.',
                  ),
                );
              }}
              className="min-h-12 rounded-lg border border-slate-300 px-3 text-sm"
            >
              Full screen
            </button>
          </>
        ) : null}
        <span className="text-base text-slate-600">{status}</span>
        {unifiedTask ? (
          <span className="max-w-full truncate rounded-full border border-violet-500/50 bg-violet-500/10 px-2 py-1 text-sm font-bold text-violet-800">
            LIZZY conversation · {unifiedTask.title || unifiedTask.planId}
          </span>
        ) : null}
      </header>
      {session ? (
        <nav
          aria-label="Browser tabs"
          className={`${controlsOpen ? 'flex' : 'hidden'} shrink-0 gap-2 overflow-x-auto border-b border-slate-200 p-2`}
        >
          <button
            onClick={() => action({ type: 'new_tab', url: target })}
            className="min-h-12 shrink-0 rounded-lg border border-slate-300 px-3"
          >
            New tab
          </button>
          {browserTabs.map((tab) => (
            <button
              key={tab.id}
              aria-pressed={tab.id === activeTabId}
              onClick={() => action({ type: 'switch_tab', tabId: tab.id })}
              className="min-h-12 max-w-64 truncate rounded-lg border border-slate-300 px-3 text-sm aria-pressed:bg-cyan-100"
            >
              {tab.url || 'New tab'}
            </button>
          ))}
          {browserTabs.length > 1 ? (
            <button
              onClick={() => action({ type: 'close_tab', tabId: activeTabId })}
              className="min-h-12 shrink-0 rounded-lg border border-slate-300 px-3"
            >
              Close tab
            </button>
          ) : null}
        </nav>
      ) : null}
      {foundationChecks.length ? (
        <details className="max-h-[25dvh] shrink-0 overflow-y-auto border-b border-slate-300 p-3 text-base">
          <summary>Live Chromium acceptance</summary>
          <table className="w-full">
            <tbody>
              {foundationChecks.map((check) => (
                <tr key={check.name}>
                  <td className="p-2">{check.name.replaceAll('_', ' ')}</td>
                  <td className="p-2">
                    {check.passed ? 'PASS' : `FAIL: ${check.reason || 'check failed'}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      ) : null}
      {browserDialog ? (
        <div
          role="dialog"
          aria-label="Browser confirmation"
          className="border-b border-slate-300 p-3"
        >
          <p>{browserDialog.message}</p>
          {browserDialog.type === 'prompt' ? (
            <input
              aria-label="Browser prompt response"
              value={dialogText}
              onChange={(event) => setDialogText(event.target.value)}
              className="rounded bg-slate-100 p-3 text-base"
            />
          ) : null}
          <button
            onClick={() => action({ type: 'dialog', accept: true, text: dialogText })}
            className="min-h-12 px-4"
          >
            Accept
          </button>
          <button
            onClick={() => action({ type: 'dialog', accept: false })}
            className="min-h-12 px-4"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {filePicker ? (
        <label className="border-b border-slate-300 p-3">
          Choose files for the active browser page (32 MB each)
          <input
            type="file"
            multiple
            disabled={uploading}
            onChange={(event) => void uploadFiles(event.target.files)}
            className="block min-h-12 text-base"
          />
        </label>
      ) : null}
      {error && (
        <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 max-h-[15dvh] shrink-0 overflow-auto px-3 py-2 text-base text-rose-800">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
      <nav
        aria-label="Browser workspace panels"
        className="flex shrink-0 gap-2 border-b border-slate-300 p-2 lg:hidden"
      >
        <button
          type="button"
          aria-pressed={mobilePane === 'browser'}
          onClick={() => setMobilePane('browser')}
          className="min-h-11 flex-1 rounded-lg border border-slate-400 px-3 text-base font-semibold aria-pressed:bg-cyan-100"
        >
          Browser
        </button>
        <button
          type="button"
          aria-pressed={mobilePane === 'tools'}
          onClick={() => setMobilePane('tools')}
          className="min-h-11 flex-1 rounded-lg border border-slate-400 px-3 text-base font-semibold aria-pressed:bg-cyan-100"
        >
          Sign-in &amp; tools
        </button>
      </nav>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div
          className={`${mobilePane === 'browser' ? 'flex' : 'hidden lg:flex'} relative min-h-0 items-start ${imageZoom > 1 ? 'justify-start' : 'justify-center'} overflow-auto overscroll-contain bg-slate-100`}
        >
          {session ? (
            <img
              ref={imageRef}
              src={`${endpoint}/stream?token=${encodeURIComponent(session.token)}`}
              alt="Live isolated Chromium browser"
              referrerPolicy="no-referrer"
              draggable={false}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Tab' && !event.shiftKey) return;
                event.preventDefault();
                const key = event.key === ' ' ? 'Space' : event.key;
                const modifiers = [
                  event.ctrlKey ? 'Control' : '',
                  event.metaKey ? 'Meta' : '',
                  event.altKey ? 'Alt' : '',
                  event.shiftKey ? 'Shift' : '',
                ].filter(Boolean);
                if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey)
                  void action({ type: 'type', text: event.key });
                else
                  void action({
                    type: 'keypress',
                    key: [...modifiers, key].join('+'),
                  });
              }}
              onPaste={(event) => {
                event.preventDefault();
                void action({
                  type: 'type',
                  text: event.clipboardData.getData('text/plain'),
                });
              }}
              className="h-auto shrink-0 cursor-crosshair select-none bg-white shadow-sm"
              style={{ width: `${imageZoom * 100}%`, maxWidth: signInView ? `${480 * imageZoom}px` : imageZoom > 1 ? 'none' : '100%', touchAction: 'pan-x pan-y pinch-zoom' }}
              onPointerDown={(event) => {
                draggedRef.current = false;
                // Touch drags belong to the local scroll/zoom viewport. A tap
                // still reaches onClick, while mouse selection remains remote.
                if (event.pointerType === 'touch') {
                  dragStartRef.current = null;
                  return;
                }
                const rect = event.currentTarget.getBoundingClientRect();
                draggedRef.current = false;
                dragStartRef.current = {
                  x: Math.round(
                    ((event.clientX - rect.left) * session.viewport.width) / rect.width,
                  ),
                  y: Math.round(
                    ((event.clientY - rect.top) * session.viewport.height) / rect.height,
                  ),
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                const start = dragStartRef.current;
                dragStartRef.current = null;
                if (!start) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const end = {
                  x: Math.round(
                    ((event.clientX - rect.left) * session.viewport.width) / rect.width,
                  ),
                  y: Math.round(
                    ((event.clientY - rect.top) * session.viewport.height) / rect.height,
                  ),
                };
                if (Math.hypot(end.x - start.x, end.y - start.y) > 5) {
                  draggedRef.current = true;
                  void action({ type: 'drag', path: [start, end] });
                }
              }}
              onPointerCancel={() => {
                dragStartRef.current = null;
              }}
              onClick={(event) => {
                if (draggedRef.current) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const point = {
                  x: Math.round(
                    ((event.clientX - rect.left) * session.viewport.width) / rect.width,
                  ),
                  y: Math.round(
                    ((event.clientY - rect.top) * session.viewport.height) / rect.height,
                  ),
                };
                void action({
                  type: 'pointer_click',
                  clickCount: Math.min(2, Math.max(1, event.detail)),
                  ...point,
                });
              }}
              onContextMenu={(event) => {
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                void action({
                  type: 'click',
                  button: 'right',
                  x: Math.round(
                    ((event.clientX - rect.left) * session.viewport.width) / rect.width,
                  ),
                  y: Math.round(
                    ((event.clientY - rect.top) * session.viewport.height) / rect.height,
                  ),
                });
              }}
              onWheel={(event) => {
                const viewport = event.currentTarget.parentElement;
                // Pinch zoom and oversized image scrolling remain native.
                if (event.ctrlKey || (viewport &&
                  (viewport.scrollHeight > viewport.clientHeight + 1 ||
                   viewport.scrollWidth > viewport.clientWidth + 1))) return;
                event.preventDefault();
                void action({
                  type: 'scroll',
                  deltaX: event.deltaX,
                  deltaY: event.deltaY,
                });
              }}
            />
          ) : (
            <div className="text-center text-slate-600">
              <Loader2 className="mx-auto mb-3 h-8 w-8" />
              <p>Start the isolated open-source browser to inspect the live platform.</p>
            </div>
          )}
        </div>
        <aside
          className={`${mobilePane === 'tools' ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col overflow-y-auto border-t border-slate-200 bg-white lg:border-l lg:border-t-0`}
        >
          <div className="border-b border-slate-200 p-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-black text-cyan-800">
              <Download className="h-4 w-4" /> Envato licensed downloads
            </p>
            <p className="mb-2 text-sm leading-4 text-slate-600">
              Download inside this browser, then store the finished 4K file directly in the private
              Course Builder library.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={envatoItemId}
                onChange={(event) => setEnvatoItemId(event.target.value)}
                placeholder="Envato item ID"
                className="rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-base"
              />
              <input
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                placeholder="Resolution"
                className="rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-base"
              />
              <input
                value={licensedTitle}
                onChange={(event) => setLicensedTitle(event.target.value)}
                placeholder="Asset title"
                className="col-span-2 rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-base"
              />
              <input
                value={programTags}
                onChange={(event) => setProgramTags(event.target.value)}
                placeholder="Programs: barber, hvac"
                className="col-span-2 rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-base"
              />
              <input
                value={lessonTags}
                onChange={(event) => setLessonTags(event.target.value)}
                placeholder="Lesson tags, comma separated"
                className="col-span-2 rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-base"
              />
            </div>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {downloads.map((download) => (
                <div
                  key={download.id}
                  className="rounded border border-slate-200 bg-slate-50 p-2 text-sm"
                >
                  <p className="truncate font-bold text-slate-950">{download.fileName}</p>
                  <p className="text-slate-600">
                    {download.status} ·{' '}
                    {download.size ? `${Math.round(download.size / 1048576)} MB` : 'preparing'}
                    {download.status === 'uploading' ? ` · ${download.uploadProgress || 0}%` : ''}
                  </p>
                  {download.error ? <p className="text-rose-300">{download.error}</p> : null}
                  {download.status === 'ready' && session ? (
                    <a
                      href={`${endpoint}/file?id=${encodeURIComponent(download.id)}&token=${encodeURIComponent(session.token)}`}
                      referrerPolicy="no-referrer"
                      className="block min-h-12 rounded-lg border border-slate-400 p-3 text-sm"
                    >
                      Download file
                    </a>
                  ) : null}
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
                <p className="text-sm text-slate-600">No browser downloads yet.</p>
              ) : null}
            </div>
          </div>
          <div className="border-b border-slate-200 p-3">
            <p className="mb-1 text-xs font-black text-violet-800">LIZZY Browser Task</p>
            <p className="mb-2 text-sm text-slate-600">
              Runs as a tool in this LIZZY conversation. Progress, approvals, evidence, and results
              appear in the conversation timeline.
            </p>
            {activeTaskId && (
              <p className="mb-2 block truncate rounded border border-slate-200 bg-slate-50 px-2 py-1 text-sm text-cyan-800">
                Task evidence: {activeTaskId}
              </p>
            )}
            <textarea
              value={agentTask}
              onChange={(event) => setAgentTask(event.target.value)}
              rows={3}
              placeholder="Example: inspect every navigation link and report failures"
              className="w-full rounded border border-slate-300 bg-slate-50 p-2 text-base"
            />
            <button
              onClick={() => runAgent()}
              disabled={!session || !agentTask.trim() || agentRunning}
              className="mt-2 w-full rounded bg-violet-600 px-3 py-2 text-xs font-black disabled:opacity-50"
            >
              {agentRunning ? 'Running approved task…' : 'Run AI browser task'}
            </button>
            {(authenticationRequired || interactionRequired) && activeTaskId ? (
              <button
                onClick={() => runAgent(activeTaskId)}
                disabled={agentRunning}
                className="mt-2 min-h-12 w-full rounded bg-emerald-600 px-3 py-2 text-base font-bold"
              >
                Resume this browser task
              </button>
            ) : null}
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
              <p className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-700">
                {agentResult}
              </p>
            )}
          </div>
          <div className="order-first shrink-0 border-b border-slate-200 p-3">
            <p className="mb-2 text-xl font-bold text-emerald-800">Sign in securely</p>
            <p className="mb-2 text-base leading-6 text-slate-700">
              1. Select the email or password field on the website. 2. Enter it below. 3. Select Type securely, then Enter. Your entry clears immediately and stays out of the chat.
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              {(['email', 'password'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={secureInputKind === kind}
                  onClick={() => {
                    if (secureInputRef.current) secureInputRef.current.value = '';
                    setSecureInputKind(kind);
                    secureInputRef.current?.focus();
                  }}
                  className="min-h-12 rounded border border-emerald-300 px-4 text-base aria-pressed:bg-emerald-100"
                >
                  {kind === 'email' ? 'Email input' : 'Password input'}
                </button>
              ))}
            </div>
            <label className="mb-2 block text-base" htmlFor={secureInputId}>
              {secureInputKind === 'email' ? 'Email address' : 'Password'}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id={secureInputId}
                ref={secureInputRef}
                type={secureInputKind === 'password' ? 'password' : 'text'}
                inputMode={secureInputKind === 'email' ? 'email' : 'text'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                aria-label="Secure browser input"
                disabled={!session || sendingSecureInput}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void sendSecureInput();
                  }
                }}
                className="min-h-12 w-full min-w-0 rounded border border-emerald-300 bg-slate-50 px-3 py-3 text-xl"
              />
              {secureInputKind === 'email' ? (
                <button
                  type="button"
                  aria-label="Insert at sign into secure input"
                  disabled={!session || sendingSecureInput}
                  onClick={() => {
                    const input = secureInputRef.current;
                    if (!input) return;
                    const start = input.selectionStart ?? input.value.length;
                    const end = input.selectionEnd ?? start;
                    input.value = input.value.slice(0, start) + '@' + input.value.slice(end);
                    input.setSelectionRange(start + 1, start + 1);
                    input.focus();
                  }}
                  className="min-h-12 min-w-12 rounded border border-emerald-300 px-4 text-xl"
                >
                  @
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void sendSecureInput()}
                disabled={!session || sendingSecureInput}
                className="min-h-12 rounded bg-emerald-600 px-4 text-base font-bold text-white disabled:opacity-50"
              >
                {sendingSecureInput ? 'Sending securely…' : 'Type securely'}
              </button>
              <button
                type="button"
                onClick={() => void action({ type: 'keypress', key: 'Enter' })}
                disabled={!session || sendingSecureInput}
                className="min-h-12 rounded border border-emerald-300 px-4 text-base text-emerald-800 disabled:opacity-50"
              >
                Enter
              </button>
            </div>
            <label className="mt-3 flex min-h-12 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={replaceSecureInput}
                onChange={(event) => setReplaceSecureInput(event.target.checked)}
              />
              Replace the selected browser field
            </label>
          </div>
          <div className="border-b border-slate-200 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-black">
              <Keyboard className="h-4 w-4" /> Keyboard input
            </p>
            <div className="flex gap-2">
              <input
                aria-label="Browser keyboard input"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={typedText}
                onChange={(event) => setTypedText(event.target.value)}
                className="min-w-0 flex-1 rounded border border-slate-300 bg-slate-50 px-2 py-1.5 text-base"
              />
              <button
                onClick={() => {
                  void action({ type: 'type', text: typedText });
                  setTypedText('');
                }}
                disabled={!session}
                className="rounded bg-slate-200 px-2 text-xs"
              >
                Type
              </button>
            </div>
            <button type="button" aria-label="Insert at sign into browser keyboard input"
              disabled={!session} onClick={() => setTypedText((value) => value + '@')}
              className="mt-2 min-h-12 min-w-12 rounded border border-slate-300 px-4 text-xl">@</button>
            <div className="mt-2 flex gap-2">
              {['Enter', 'Tab', 'Escape', 'Backspace'].map((key) => (
                <button
                  key={key}
                  onClick={() =>
                    key === 'Enter'
                      ? void submitBrowserEnter()
                      : void action({ type: 'keypress', key })
                  }
                  disabled={!session}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
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
                    className="mb-2 rounded border border-slate-200 bg-slate-50 p-2 text-sm"
                  >
                    <span className="font-bold text-cyan-800">{item.type}</span>{' '}
                    <span className="text-slate-600">{item.at}</span>
                    <p className="mt-1 break-all text-slate-700">
                      {item.text || item.error || `${item.status || ''} ${item.url || ''}`}
                    </p>
                  </div>
                ))
            ) : (
              <p className="text-xs text-slate-600">
                Console errors, failed requests, and HTTP failures will appear here.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
