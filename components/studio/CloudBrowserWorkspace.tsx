'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Globe2, Keyboard, Loader2, MousePointer2, RefreshCw, Square } from 'lucide-react';

type Session = { id: string; token: string; publicUrl: string; url: string; viewport: { width: number; height: number }; expiresAt: string };
type BrowserEvent = { type: string; at: string; level?: string; text?: string; url?: string; status?: number; error?: string };

export default function CloudBrowserWorkspace() {
  const [target, setTarget] = useState('https://www.elevateforhumanity.org');
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState('Ready to start');
  const [runtimeReady, setRuntimeReady] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<BrowserEvent[]>([]);
  const [typedText, setTypedText] = useState('');
  const [agentTask, setAgentTask] = useState('');
  const [agentResult, setAgentResult] = useState('');
  const [agentRunning, setAgentRunning] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const endpoint = session ? `${session.publicUrl}/sessions/${session.id}` : '';
  const authHeaders = session ? { Authorization: `Bearer ${session.token}` } : {};

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/dev-studio/browser/session', { cache: 'no-store' })
      .then(async (response) => ({ response, payload: await response.json() }))
      .then(({ response, payload }) => {
        if (cancelled) return;
        const ready = response.ok && payload.configured === true && payload.ready === true;
        setRuntimeReady(ready);
        setStatus(ready ? 'Ready to start' : payload.configured ? 'Runtime is offline' : 'Runtime is not configured');
        if (!ready) setError(payload.configured
          ? 'The isolated browser service is configured but is not responding.'
          : 'Configure STUDIO_BROWSER_URL, STUDIO_BROWSER_PUBLIC_URL, and STUDIO_BROWSER_SECRET in Containers before starting Chromium.');
      })
      .catch(() => {
        if (!cancelled) {
          setRuntimeReady(false);
          setStatus('Runtime check failed');
          setError('Could not verify the isolated browser runtime.');
        }
      });
    return () => { cancelled = true; };
  }, []);

  async function start() {
    setError(''); setStatus('Starting isolated Chromium…');
    const response = await fetch('/api/admin/dev-studio/browser/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: target, width: 1440, height: 900 }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error || 'Could not start browser'); setStatus('Unavailable'); return; }
    setSession(payload); setStatus('Connected');
  }

  async function action(payload: Record<string, unknown>) {
    if (!session) return;
    const response = await fetch(`${endpoint}/actions`, { method: 'POST', headers: { ...authHeaders, 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || 'Browser action failed');
    else if (body.url) setTarget(body.url);
  }

  async function stop() {
    if (session) await fetch(endpoint, { method: 'DELETE', headers: authHeaders }).catch(() => undefined);
    setSession(null); setEvents([]); setStatus('Stopped');
  }

  async function runAgent() {
    if (!session || !agentTask.trim()) return;
    setAgentRunning(true); setAgentResult(''); setError('');
    try {
      const response = await fetch('/api/admin/dev-studio/browser/agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ task: agentTask, sessionId: session.id, sessionToken: session.token }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'AI browser task failed');
      setAgentResult(payload.output || `Completed ${payload.steps?.length || 0} browser steps.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'AI browser task failed'); }
    finally { setAgentRunning(false); }
  }

  useEffect(() => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.token}` };
    const timer = window.setInterval(async () => {
      const response = await fetch(`${endpoint}/events`, { headers }).catch(() => null);
      if (response?.ok) {
        const payload = await response.json();
        setEvents(payload.events || []);
        if (payload.url) setTarget(payload.url);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [endpoint, session]);

  useEffect(() => {
    if (!session) return;
    const token = session.token;
    return () => { void fetch(endpoint, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` }, keepalive: true }); };
  }, [endpoint, session]);

  return (
    <div className="flex h-full min-h-[720px] flex-col bg-slate-950 text-white">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 p-3">
        <Globe2 className="h-5 w-5 text-cyan-300" /><strong className="mr-2">Cloud Browser</strong>
        <input value={target} onChange={(event) => setTarget(event.target.value)} className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs" aria-label="Browser URL" />
        {!session ? <button onClick={start} disabled={runtimeReady !== true} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">Start Chromium</button> : <>
          <button onClick={() => action({ type: 'navigate', url: target })} className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-black text-slate-950">Go</button>
          <button onClick={() => action({ type: 'reload' })} className="rounded-lg border border-slate-700 p-2" title="Reload"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={stop} className="rounded-lg border border-rose-800 p-2 text-rose-300" title="Stop"><Square className="h-4 w-4" /></button>
        </>}
        <span className="text-[11px] text-slate-400">{status}</span>
      </header>
      {error && <div className="flex items-center gap-2 border-b border-rose-900 bg-rose-950/60 px-3 py-2 text-xs text-rose-200"><AlertTriangle className="h-4 w-4" />{error}</div>}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative flex min-h-[520px] items-center justify-center overflow-auto bg-slate-800 p-3">
          {session ? <img
            ref={imageRef}
            src={`${endpoint}/stream?token=${encodeURIComponent(session.token)}`}
            alt="Live isolated Chromium browser"
            referrerPolicy="no-referrer"
            draggable={false}
            className="max-h-full max-w-full cursor-crosshair select-none bg-white shadow-2xl"
            onClick={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              void action({ type: 'click', x: Math.round((event.clientX - rect.left) * session.viewport.width / rect.width), y: Math.round((event.clientY - rect.top) * session.viewport.height / rect.height) });
            }}
            onWheel={(event) => { event.preventDefault(); void action({ type: 'scroll', deltaX: event.deltaX, deltaY: event.deltaY }); }}
          /> : <div className="text-center text-slate-400"><Loader2 className="mx-auto mb-3 h-8 w-8" /><p>Start the isolated open-source browser to inspect the live platform.</p></div>}
        </div>
        <aside className="flex min-h-0 flex-col border-l border-slate-800 bg-slate-950">
          <div className="border-b border-slate-800 p-3">
            <p className="mb-1 text-xs font-black text-violet-300">Optional OpenAI Computer Use</p>
            <p className="mb-2 text-[10px] text-slate-500">Runs only when you press Run and may consume API credits. High-impact actions are blocked.</p>
            <textarea value={agentTask} onChange={(event) => setAgentTask(event.target.value)} rows={3} placeholder="Example: inspect every navigation link and report failures" className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs" />
            <button onClick={runAgent} disabled={!session || !agentTask.trim() || agentRunning} className="mt-2 w-full rounded bg-violet-600 px-3 py-2 text-xs font-black disabled:opacity-50">{agentRunning ? 'Running approved task…' : 'Run AI browser task'}</button>
            {agentResult && <p className="mt-2 rounded bg-slate-900 p-2 text-[10px] text-slate-300">{agentResult}</p>}
          </div>
          <div className="border-b border-slate-800 p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-black"><Keyboard className="h-4 w-4" /> Keyboard input</p>
            <div className="flex gap-2"><input value={typedText} onChange={(event) => setTypedText(event.target.value)} className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs" /><button onClick={() => { void action({ type: 'type', text: typedText }); setTypedText(''); }} disabled={!session} className="rounded bg-slate-700 px-2 text-xs">Type</button></div>
            <div className="mt-2 flex gap-2">{['Enter','Tab','Escape','Backspace'].map((key) => <button key={key} onClick={() => action({ type: 'keypress', key })} disabled={!session} className="rounded border border-slate-700 px-2 py-1 text-[10px]">{key}</button>)}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <p className="mb-2 flex items-center gap-2 text-xs font-black"><MousePointer2 className="h-4 w-4" /> Browser evidence</p>
            {events.length ? events.slice(-100).reverse().map((item, index) => <div key={`${item.at}-${index}`} className="mb-2 rounded border border-slate-800 bg-slate-900 p-2 text-[10px]"><span className="font-bold text-cyan-300">{item.type}</span> <span className="text-slate-500">{item.at}</span><p className="mt-1 break-all text-slate-300">{item.text || item.error || `${item.status || ''} ${item.url || ''}`}</p></div>) : <p className="text-xs text-slate-500">Console errors, failed requests, and HTTP failures will appear here.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
