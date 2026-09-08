'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Globe2,
  Keyboard,
  Loader2,
  MousePointer2,
  RefreshCw,
  Square,
} from 'lucide-react';

type Session = {
  id: string;
  token: string;
  publicUrl: string;
  url: string;
  viewport: { width: number; height: number };
  expiresAt: string;
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

export default function CloudBrowserWorkspace() {
  const [target, setTarget] = useState('https://admin.elevateforhumanity.org/dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState('Ready to start');
  const [runtimeReady, setRuntimeReady] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<BrowserEvent[]>([]);
  const [typedText, setTypedText] = useState('');
  const [agentTask, setAgentTask] = useState('');
  const [agentResult, setAgentResult] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState('');
  const imageRef = useRef<HTMLImageElement>(null);

  const endpoint = session ? `${session.publicUrl}/sessions/${session.id}` : '';
  const authHeaders = session ? { Authorization: `Bearer ${session.token}` } : {};

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
    setStatus('Starting isolated Chromiumâ€¦');
    const response = await fetch('/api/admin/dev-studio/browser/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: target, width: 1440, height: 900 }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Could not start browser');
      setStatus('Unavailable');
      return;
    }
    setSession(payload);
    setStatus('Connected');
  }

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
          onChange={(event) => setTarget(event.target.value)}
          className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs"
          aria-label="Browser URL"
        />
        {!session ? (
          <button
            onClick={start}
            disabled={runtimeReady !== true}
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
      </header>
      {error && (
        <div className="flex items-center gap-2 border-b border-rose-900 bg-rose-950/60 px-3 py-2 text-xs text-rose-200">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative flex min-h-0 items-center justify-center overflow-auto bg-slate-800 p-3">
          {session ? (
            <img
              ref={imageRef}
              src={`${endpoint}/stream?token=${encodeURIComponent(session.token)}`}
              alt="Live isolated Chromium browser"
              referrerPolicy="no-referrer"
              draggable={false}
              className="max-h-full max-w-full cursor-crosshair select-none bg-white shadow-2xl"
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
        <aside className="flex min-h-0 flex-col border-l border-slate-800 bg-slate-950">
          <div className="border-b border-slate-800 p-3">
            <p className="mb-1 text-xs font-black text-violet-300">Governed AI Browser Task</p>
            <p classNamµã[h‘éì¶»§q«^t€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰¡¥‘‘•¸¥Ñ•µÌµ•¹Ñ•È…À´ÄÍ´é™±•àˆÉ½±”ô‰É½ÕÀˆ…É¥„µ±…‰•°ô‰¡½½Í”$…•¹Ðˆø(€€€€€€€€€€€ì¡l11%œ°€1%iidœ°€AI%Lt…Ì½¹ÍÐ¤¹µ…À ¡…•¹Ð¤€ôø€ (€€€€€€€€€€€€€€ñ‰ÕÑÑ½¸­•äõí…•¹ÑôÑåÁ”ô‰‰ÕÑÑ½¸ˆ…É¥„µÁÉ•ÍÍ•õíÍ•±•Ñ•‘•¹Ð€ôôô…•¹Ñô½¹±¥¬õì ¤€ôøìÍ•ÑM•±•Ñ•‘•¹Ð¡…•¹Ð¤ìÍ•Ñ½¹Ù•ÉÍ…Ñ¥½¹-•ä ¡Ù…±Õ”¤€ôøÙ…±Õ”€¬€Ä¤ìõô±…ÍÍ9…µ”õíÉ½Õ¹‘•µ±œÁà´ÌÁä´ÈÑ•áÐµáÌ™½¹Ðµ‰±…¬€‘íÍ•±•Ñ•‘•¹Ð€ôôô…•¹Ð€ü€‰œµÝ¡¥Ñ”Ñ•áÐµÍ±…Ñ”´äÔÀœ€è€Ñ•áÐµÍ±…Ñ”´ÌÀÀ¡½Ù•Èé‰œµÝ¡¥Ñ”¼ÄÀõôø(€€€€€€€€€€€€€€€í…•¹ÑlÁt€¬…•¹Ð¹Í±¥” Ä¤¹Ñ½1½Ý•É…Í” ¥ô(€€€€€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€¤¥ô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½‘¥Øø(€€€€€€€€ñ¹…Ø…É¥„µ±…‰•°ô‰MÑÕ‘¥¼Ñ½½±Ìˆ±…ÍÍ9…µ”ô‰ÍÉ½±±‰…Èµ¡¥‘”™±•àµ¥¸µÜ´À¥Ñ•µÌµ•¹Ñ•È…À´Ä½Ù•É™±½Üµàµ…ÕÑ¼‰½É‘•ÈµÐ‰½É‘•ÈµÝ¡¥Ñ”¼ÄÀÁà´ÈÁä´Ä¸Ôˆø(€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ5½‰¥±•MÕÉ™…” ¡…Ðœ¥ô±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•àµ¥¸µ ´äÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È…À´ÈÉ½Õ¹‘•µ±œ‰œµÝ¡¥Ñ”¼ÄÀÁà´ÌÑ•áÐµáÌ™½¹Ðµ‰½±¡½Ù•Èé‰œµÝ¡¥Ñ”¼ÄÔˆø(€€€€€€€€€€€€ñ5•ÍÍ…•MÅÕ…É”±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø¡…Ð(€€€€€€€€€€ð½‰ÕÑÑ½¸ø(€€€€€€€€€íÝ½É­ÍÁ…•Ì¹µ…À ¡Ý½É­ÍÁ…”¤€ôø€ (€€€€€€€€€€€€ñ1¥¹¬­•äõíÝ½É­ÍÁ…”¹¥‘ô¡É•˜õíÝ½É­ÍÁ…”¹É½ÕÑ•ô±…ÍÍ9…µ”ô‰¥¹±¥¹”µ™±•àµ¥¸µ ´äÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•ÈÉ½Õ¹‘•µ±œÁà´ÌÑ•áÐµáÌ™½¹ÐµÍ•µ¥‰½±Ñ•áÐµÍ±…Ñ”´ÌÀÀ¡½Ù•Èé‰œµÝ¡¥Ñ”¼ÄÀ¡½Ù•ÈéÑ•áÐµÝ¡¥Ñ”ˆùíÝ½É­ÍÁ…”¹±…‰•±ôð½1¥¹¬ø(€€€€€€€€€€¤¥ô(€€€€€€€€ð½¹…Øø(€€€€€€ð½¡•…‘•Èø((€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•àµ¥¸µ ´Àµ¥¸µÜ´À™±•à´Äˆø(€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”õí€‘íµ½‰¥±•MÕÉ™…”€ôôô€¡…Ðœ€ü€™±•àœ€è€¡¥‘‘•¸ôµ¥¸µ ´Àµ¥¸µÜ´À™±•à´Ä™±•àµ½°‰½É‘•ÈµÈ‰½É‘•ÈµÍ±…Ñ”´ÈÀÀ±œé™±•à±œé‰…Í¥ÌµlÐÈ•uôø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰™±•àÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È…À´È‰½É‘•Èµˆ‰½É‘•ÈµÍ±…Ñ”´ÈÀÀ‰œµÍ±…Ñ”´ÔÀÁà´ÌÁä´ÈÍ´é¡¥‘‘•¸ˆø(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Ñ•áÐµáÌ™½¹Ðµ‰½±Ñ•áÐµÍ±…Ñ”´ÜÀÀˆù•¹ÐèíÍ•±•Ñ•‘•¹ÑlÁt€¬Í•±•Ñ•‘•¹Ð¹Í±¥” Ä¤¹Ñ½1½Ý•É…Í” ¥ôð½ÍÁ…¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ5½‰¥±•MÕÉ™…” Ñ½½°œ¥ô±…ÍÍ9…µ”ô‰µ°µ…ÕÑ¼É½Õ¹‘•µ±œ‰œµÍ±…Ñ”´äÀÀÁà´ÌÁä´ÈÑ•áÐµáÌ™½¹Ðµ‰½±Ñ•áÐµÝ¡¥Ñ”ˆù=Á•¸Ý½É­ÍÁ…”ð½‰ÕÑÑ½¸ø(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€ñU¹¥™¥•‘±±¥•¡…Ð­•äõí½¹Ù•ÉÍ…Ñ¥½¹-•åôÁÉ•™•ÉÉ•‘•¹ÐõíÍ•±•Ñ•‘•¹Ñô•µ‰•‘‘•½¹=Á•¹AÉ•Ù¥•Üõì ¤€ôø½Á•¹AÉ•Ù¥•Ü ¥ô½¹AÉ•Ù¥•ÝQ…É•Ðõí½Á•¹AÉ•Ù¥•Ýô€¼ø(€€€€€€€€ð½Í•Ñ¥½¸ø((€€€€€€€€ñÍ•Ñ¥½¸±…ÍÍ9…µ”õí€‘íµ½‰¥±•MÕÉ™…”€ôôô€Ñ½½°œ€ü€™±•àœ€è€¡¥‘‘•¸ôµ¥¸µ ´Àµ¥¸µÜ´À™±•à´Ä™±•àµ½°‰œµÍ±…Ñ”´äÔÀ±œé™±•à±œé‰…Í¥ÌµlÔà•uô…É¥„µ±…‰•°ô‰MÑÕ‘¥¼Ý½É­ÍÁ…”ˆø(€€€€€€€€€€ñ¡•…‘•È±…ÍÍ9…µ”ô‰™±•àµ¥¸µ ´ÄÈÍ¡É¥¹¬´À¥Ñ•µÌµ•¹Ñ•È…À´È‰½É‘•Èµˆ‰½É‘•ÈµÍ±…Ñ”´àÀÀ‰œµÍ±…Ñ”´äÀÀÁà´ÌÑ•áÐµÝ¡¥Ñ”ˆø(€€€€€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰µÈµ…ÕÑ¼Ñ•áÐµáÌ™½¹Ðµ‰±…¬ˆùÑ¥Ù”Ý½É­ÍÁ…”ð½ÍÁ…¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ5½‘” ÁÉ•Ù¥•Üœ¥ô±…ÍÍ9…µ”õí¥¹±¥¹”µ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÄÉ½Õ¹‘•µµÁà´ÌÁä´ÈÑ•áÐµáÌ™½¹Ðµ‰½±€‘íµ½‘”€ôôô€ÁÉ•Ù¥•Üœ€ü€‰œµå…¸´ÔÀÀÑ•áÐµÍ±…Ñ”´äÔÀœ€è€Ñ•áÐµÍ±…Ñ”´ÌÀÀ¡½Ù•Èé‰œµÍ±…Ñ”´àÀÀõôøñå”±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼øAÉ•Ù¥•Üð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ5½‘” ‰É½ÝÍ•Èœ¥ô±…ÍÍ9…µ”õí¥¹±¥¹”µ™±•à¥Ñ•µÌµ•¹Ñ•È…À´ÄÉ½Õ¹‘•µµÁà´ÌÁä´ÈÑ•áÐµáÌ™½¹Ðµ‰½±€‘íµ½‘”€ôôô€‰É½ÝÍ•Èœ€ü€‰œµÙ¥½±•Ð´ÔÀÀÑ•áÐµÝ¡¥Ñ”œ€è€Ñ•áÐµÍ±…Ñ”´ÌÀÀ¡½Ù•Èé‰œµÍ±…Ñ”´àÀÀõôøñ±½‰”È±…ÍÍ9…µ”ô‰ ´ÐÜ´Ðˆ…É¥„µ¡¥‘‘•¸ô‰ÑÉÕ”ˆ€¼ø	É½ÝÍ•Èð½‰ÕÑÑ½¸ø(€€€€€€€€€€€€ñ‰ÕÑÑ½¸ÑåÁ”ô‰‰ÕÑÑ½¸ˆ½¹±¥¬õì ¤€ôøÍ•Ñ5½‰¥±•MÕÉ™…” ¡…Ðœ¥ô±…ÍÍ9…µ”ô‰É½Õ¹‘•µµÁà´ÌÁä´ÈÑ•áÐµáÌ™½¹Ðµ‰½±Ñ•áÐµÍ±…Ñ”´ÈÀÀ¡½Ù•Èé‰œµÍ±…Ñ”´àÀÀ±œé¡¥‘‘•¸ˆù‘µ¥¸$ð½‰ÕÑÑ½¸ø(€€€€€€€€€€ð½¡•…‘•Èø(€€€€€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰µ¥¸µ ´À™±•à´Ä½Ù•É™±½Üµ¡¥‘‘•¸À´Èˆø(€€€€€€€€€€€íµ½‘”€ôôô€ÁÉ•Ù¥•Üœ€ü€ñI•Á½Í¥Ñ½Éå1¥Ù•AÉ•Ù¥•Ü™¥±•A…Ñ õí¹Õ±±ô½¹Ñ•¹Ðôˆˆ¥¹¥Ñ¥…±UÉ°õíÁÉ•Ù¥•ÝUÉ±ô€¼ø€è€ñ±½Õ‘	É½ÝÍ•É]½É­ÍÁ…”€¼ùô(€€€€€€€€€€ð½‘¥Øø(€€€€€€€€ð½Í•Ñ¥½¸ø(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€¤ì)ô(