'use client';
import { useCallback, useEffect, useState } from 'react';
export function TextWorkspace() {
  const [data, setData] = useState<any>(null),
    [to, setTo] = useState(''),
    [body, setBody] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [requestKey, setKey] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/communications/texts', { cache: 'no-store' }),
        json = await r.json();
      if (!r.ok) throw Error(json.error || 'Texts unavailable');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Texts unavailable');
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const key = requestKey || crypto.randomUUID();
    setKey(key);
    try {
      const r = await fetch('/api/communications/texts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, body, requestKey: key }),
        }),
        result = await r.json();
      if (!r.ok || !result.ok) throw Error(result.error || 'Text acceptance unconfirmed');
      setBody('');
      setKey('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Text status unknown. Refresh before retrying.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4">
      <h1 className="text-3xl font-black text-slate-950">Text messages</h1>
      <p className="text-sm text-slate-700">
        Send and reply using your assigned Elevate business number.
      </p>
      <button
        type="button"
        onClick={() => void load()}
        className="rounded-lg border bg-white px-4 py-2 font-bold"
      >
        Refresh texts
      </button>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-950">
          {error}
        </p>
      )}
      {!data?.readOnly && (
        <form onSubmit={send} className="space-y-3 rounded-2xl border bg-white p-5">
          <label className="block font-bold">
            To
            <input
              aria-label="Text recipient phone number"
              type="tel"
              required
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setKey('');
              }}
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <label className="block font-bold">
            Message
            <textarea
              aria-label="Text message"
              required
              maxLength={1600}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setKey('');
              }}
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !data}
            className="rounded-lg bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send text'}
          </button>
        </form>
      )}
      <section aria-label="Text inbox" className="space-y-3">
        {data?.messages?.map((m: any) => (
          <article key={m.id} className="rounded-xl border bg-white p-4">
            <p className="font-bold">
              {m.direction === 'inbound' ? m.from_number : `To ${m.to_number}`}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
            <p className="mt-2 text-xs text-slate-600">
              {m.status} · {new Date(m.created_at).toLocaleString()}
            </p>
            {m.error_message && <p className="mt-2 text-sm text-red-800">{m.error_message}</p>}
            {!data.readOnly && (
              <button
                type="button"
                onClick={() => {
                  setTo(m.direction === 'inbound' ? m.from_number : m.to_number);
                  setKey('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mt-3 rounded-lg border px-4 py-2 font-bold text-blue-800"
              >
                Reply by text
              </button>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
