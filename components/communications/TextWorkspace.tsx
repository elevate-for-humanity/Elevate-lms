'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { groupSmsThreads, smsThreadPreview, type SmsMessageLike } from '@/lib/phone/sms-threads';

export function TextWorkspace() {
  const [data, setData] = useState<any>(null),
    [to, setTo] = useState(''),
    [body, setBody] = useState(''),
    [picture, setPicture] = useState<File | null>(null),
    [pictureKey, setPictureKey] = useState(0),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [requestKey, setKey] = useState(''),
    [composing, setComposing] = useState(false),
    [selectedKey, setSelectedKey] = useState<string | null>(null),
    [replyBody, setReplyBody] = useState('');
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
  const threads = useMemo(
    () => groupSmsThreads((data?.messages ?? []) as SmsMessageLike[]),
    [data],
  );
  const selectedThread = threads.find((thread) => thread.key === selectedKey) ?? null;
  async function sendText(toValue: string, bodyValue: string, pictureFile: File | null) {
    setBusy(true);
    setError('');
    const key = requestKey || crypto.randomUUID();
    setKey(key);
    try {
      const payload = new FormData();
      payload.set('to', toValue); payload.set('body', bodyValue); payload.set('requestKey', key);
      if (pictureFile) payload.set('picture', pictureFile);
      const r = await fetch('/api/communications/texts', {
          method: 'POST',
          body: payload,
        }),
        result = await r.json();
      if (!r.ok || !result.ok) throw Error(result.error || 'Text acceptance unconfirmed');
      setKey('');
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Text status unknown. Refresh before retrying.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (await sendText(to, body, picture)) {
      setBody('');
      setPicture(null);
      setPictureKey((value) => value + 1);
      setComposing(false);
    }
  }
  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedThread) return;
    if (await sendText(selectedThread.number, replyBody, null)) setReplyBody('');
  }
  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4">
      <h1 className="text-3xl font-black text-slate-950">Text messages</h1>
      <p className="text-sm text-slate-700">
        Send and reply using your assigned Elevate business number.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border bg-white px-4 py-2 font-bold"
        >
          Refresh texts
        </button>
        {!data?.readOnly && data?.sendingEnabled !== false && (
          <button
            type="button"
            onClick={() => {
              setComposing((value) => !value);
              setSelectedKey(null);
            }}
            className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white"
          >
            New message
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-950">
          {error}
        </p>
      )}
      {data?.messagingNotice && <p className="rounded-xl bg-blue-50 p-4 text-blue-950">{data.messagingNotice}</p>}
      {!data?.readOnly && data?.sendingEnabled !== false && composing && (
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
              required={!picture}
              maxLength={1600}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setKey('');
              }}
              className="mt-2 w-full rounded border p-3"
            />
          </label>
          <label className="block font-bold">
            Picture (optional)
            <input key={pictureKey} type="file" accept="image/jpeg,image/png,image/gif"
              onChange={(event) => { setPicture(event.target.files?.[0] || null); setKey(''); }}
              disabled={busy} className="mt-2 block w-full rounded border p-3" />
            <span className="mt-1 block text-sm font-normal text-slate-600">JPG, PNG, or GIF, up to 3 MB.</span>
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
      {selectedThread ? (
        <section aria-label={`Conversation with ${selectedThread.displayName}`} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-950">{selectedThread.displayName}</h2>
              <p className="text-sm text-slate-600">{selectedThread.number}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              className="rounded-lg border bg-white px-4 py-2 font-bold"
            >
              Back to conversations
            </button>
          </div>
          <div className="space-y-3">
            {selectedThread.messages.map((m: any) => (
              <article
                key={m.id}
                className={`max-w-[85%] rounded-xl border p-4 ${m.direction === 'inbound' ? 'bg-white' : 'ml-auto bg-blue-50'}`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                {Array.isArray(m.media) && m.media.map((_media: unknown, index: number) => (
                  <a key={index} href={`/api/communications/texts/${m.id}/media/${index}`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 block font-bold text-blue-800 underline">Open picture or attachment {index + 1}</a>
                ))}
                <p className="mt-2 text-xs text-slate-600">
                  {m.direction === 'inbound' ? 'Received' : 'Sent'} · {m.status} · {new Date(m.created_at).toLocaleString()}
                </p>
                {m.error_message && <p className="mt-2 text-sm text-red-800">{m.error_message}</p>}
              </article>
            ))}
          </div>
          {!data?.readOnly && data?.sendingEnabled !== false && (
            <form onSubmit={sendReply} className="space-y-3 rounded-2xl border bg-white p-5">
              <label className="block font-bold">
                Reply to {selectedThread.displayName}
                <textarea
                  aria-label={`Reply to ${selectedThread.displayName}`}
                  required
                  maxLength={1600}
                  value={replyBody}
                  onChange={(e) => {
                    setReplyBody(e.target.value);
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
                {busy ? 'Sending…' : 'Send reply'}
              </button>
            </form>
          )}
        </section>
      ) : (
        <section aria-label="Text conversations" className="space-y-3">
          {data && threads.length === 0 && (
            <p className="rounded-xl border bg-white p-4 text-sm text-slate-600">
              No text conversations yet. Use New message to send the first text.
            </p>
          )}
          {threads.map((thread) => (
            <button
              key={thread.key}
              type="button"
              onClick={() => {
                setSelectedKey(thread.key);
                setComposing(false);
              }}
              className="block w-full rounded-xl border bg-white p-4 text-left"
            >
              <span className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-bold">{thread.displayName}</span>
                <span className="text-xs text-slate-600">
                  {new Date(thread.lastActivityAt).toLocaleString()}
                </span>
              </span>
              <span className="mt-1 block truncate text-sm text-slate-700">
                {thread.lastMessage.direction === 'inbound' ? '' : 'You: '}
                {smsThreadPreview(thread.lastMessage)}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {thread.messages.length} message{thread.messages.length === 1 ? '' : 's'}
              </span>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}
