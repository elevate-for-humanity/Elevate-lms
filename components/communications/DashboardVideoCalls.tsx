'use client';

import { useEffect, useRef, useState } from 'react';
import { PlatformVideoRoom } from './PlatformVideoRoom';

type Call = { roomId: string; title: string; direction: 'incoming' | 'outgoing'; state: 'ringing' | 'accepted' };
export function DashboardVideoCalls({ extension, disabled = false, dialPad = false }: { extension?: string; disabled?: boolean; dialPad?: boolean }) {
  const [number, setNumber] = useState('');
  const [calls, setCalls] = useState<Call[]>([]);
  const [current, setCurrent] = useState<Call | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const destination = extension ?? number;

  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    let stopped = false;
    async function poll() {
      if (running || stopped) return;
      running = true;
      const version = revision.current;
      try {
        const response = await fetch('/api/communications/video-calls', { cache: 'no-store', signal: controller.signal });
        if ([401, 403].includes(response.status)) { stopped = true; return; }
        if (!response.ok) return;
        const body = await response.json();
        if (!Array.isArray(body.calls) || version !== revision.current || stopped) return;
        setCalls(body.calls);
        setCurrent(previous => previous ? body.calls.find((call: Call) => call.roomId === previous.roomId) || null : null);
      } catch { /* A transient polling failure does not end a connected room. */ }
      finally { running = false; }
    }
    void poll();
    const interval = setInterval(() => void poll(), 5000);
    return () => { stopped = true; controller.abort(); clearInterval(interval); };
  }, []);

  async function act(action: 'start' | 'accept' | 'decline' | 'end', call?: Call) {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/communications/video-calls', {
        method: action === 'start' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'start' ? { extension: destination } : { roomId: call?.roomId, action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'The video call could not be updated.');
      revision.current += 1;
      if (action === 'start') {
        if (!body.roomId) throw new Error('The video invitation was not confirmed.');
        setCurrent({ ...body, direction: 'outgoing' });
      } else if (action === 'accept' && call) setCurrent({ ...call, state: 'accepted' });
      else { setCurrent(null); setCalls(previous => previous.filter(item => item.roomId !== call?.roomId)); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Video calling is unavailable.'); }
    finally { setBusy(false); }
  }
  const incoming = calls.find(call => call.direction === 'incoming' && call.state === 'ringing' && call.roomId !== current?.roomId);
  return <>
    {extension !== undefined || dialPad ? <section className="space-y-3 rounded-xl border bg-white p-4">
      {dialPad ? <><h2 className="text-lg font-bold">Video call an extension</h2><input aria-label="Video call extension" inputMode="numeric" value={number} onChange={event => setNumber(event.target.value)} className="min-h-12 w-full rounded-lg border p-3" /><div className="grid grid-cols-3 gap-2">{['1','2','3','4','5','6','7','8','9','0'].map(digit => <button type="button" key={digit} onClick={() => setNumber(value => value + digit)} className="min-h-11 rounded border p-2">{digit}</button>)}<button type="button" onClick={() => setNumber(value => value.slice(0, -1))}>Delete</button><button type="button" onClick={() => setNumber('')}>Clear</button></div></> : null}
      <button type="button" disabled={disabled || busy || Boolean(current) || !/^(0|\d{3})$/.test(destination.trim())} onClick={() => void act('start')} className="min-h-12 rounded-xl bg-indigo-700 px-4 font-bold text-white disabled:opacity-50">Video call extension</button>
      <p className="text-sm text-slate-600">The recipient must answer in their dashboard. Camera and microphone permissions are controlled in the call.</p>
    </section> : null}
    {error ? <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p> : null}
    {incoming ? <section role="dialog" aria-label="Incoming video call" className="fixed inset-x-3 bottom-8 z-[105] mx-auto max-w-lg rounded-2xl bg-slate-950 p-6 text-white shadow-xl"><h2 className="text-xl font-bold">Incoming video call</h2><p>{incoming.title}</p><div className="mt-4 flex gap-3"><button type="button" disabled={busy} onClick={() => void act('accept', incoming)} className="min-h-12 rounded bg-emerald-700 px-4">Answer video call</button><button type="button" disabled={busy} onClick={() => void act('decline', incoming)} className="min-h-12 rounded bg-red-700 px-4">Decline video call</button></div></section> : null}
    {current ? <section role="dialog" aria-label="Video call" className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950 p-4 text-white"><div className="mx-auto max-w-6xl space-y-4"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{current.title}</h2><p role="status">{current.state === 'accepted' ? 'Invitation accepted' : 'Calling extension…'}</p></div><button type="button" disabled={busy} onClick={() => void act('end', current)} className="min-h-12 rounded bg-red-700 px-4 font-bold">End video call</button></div><div className="text-slate-950"><PlatformVideoRoom tokenEndpoint={`/api/communications/video-calls/${current.roomId}/token`} /></div></div></section> : null}
  </>;
}
