'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  Reply,
  Send,
  X,
} from 'lucide-react';

type Mailbox = {
  id: string;
  address: string;
  displayName: string;
  mailboxKind: 'individual' | 'program_holder' | 'host_shop' | 'department';
  accessLevel: string;
};
type Thread = {
  id: string;
  subject: string;
  last_message_at: string;
  message_count: number;
  unread: boolean;
};
type Attachment = { id: string; file_name: string; mime_type: string; size_bytes: number };
type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  status: string;
  sender_email: string;
  sender_name?: string | null;
  to_addresses: string[];
  subject: string;
  text_body: string;
  sent_at?: string | null;
  received_at?: string | null;
  created_at: string;
  attachments?: Attachment[];
};
type WorkspaceData = {
  mailboxes: Mailbox[];
  selectedMailboxId: string | null;
  threads: Thread[];
  selectedThread?: (Thread & { messages: Message[] }) | null;
};
type ComposeState = { threadId?: string; to: string; subject: string; body: string };

const EMPTY_COMPOSE: ComposeState = { to: '', subject: '', body: '' };

function formatDate(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function mailboxLabel(kind: Mailbox['mailboxKind']) {
  if (kind === 'program_holder') return 'Program';
  if (kind === 'host_shop') return 'Host Shop';
  if (kind === 'department') return 'Shared';
  return 'Personal';
}

export function EmailWorkspace({
  apiPath = '/api/communications/email',
  initialMailboxId,
}: {
  apiPath?: string;
  initialMailboxId?: string;
}) {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState<ComposeState | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const load = useCallback(
    async (mailboxId?: string | null, threadId?: string | null) => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (mailboxId) params.set('mailboxId', mailboxId);
      if (threadId) params.set('threadId', threadId);
      const response = await fetch(`${apiPath}?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) setError(payload.error || 'Email could not be loaded.');
      else setData(payload);
      setLoading(false);
    },
    [apiPath],
  );

  useEffect(() => {
    void load(initialMailboxId);
  }, [initialMailboxId, load]);

  const selectedMailbox = useMemo(
    () => data?.mailboxes.find((mailbox) => mailbox.id === data.selectedMailboxId) ?? null,
    [data],
  );

  async function openThread(threadId: string) {
    if (!data?.selectedMailboxId) return;
    await load(data.selectedMailboxId, threadId);
    void fetch(apiPath, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    });
  }

  function startReply() {
    const messages = data?.selectedThread?.messages ?? [];
    const lastInbound = [...messages].reverse().find((message) => message.direction === 'inbound');
    const recipient = lastInbound?.sender_email || messages.at(-1)?.to_addresses?.[0] || '';
    setCompose({
      threadId: data?.selectedThread?.id,
      to: recipient,
      subject: `Re: ${data?.selectedThread?.subject || ''}`,
      body: '',
    });
    setFiles([]);
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!compose || !data?.selectedMailboxId) return;
    setSending(true);
    setError('');
    const form = new FormData();
    form.set('mailboxId', data.selectedMailboxId);
    form.set('to', compose.to);
    form.set('subject', compose.subject);
    form.set('body', compose.body);
    if (compose.threadId) form.set('threadId', compose.threadId);
    files.forEach((file) => form.append('attachments', file));
    const response = await fetch(apiPath, { method: 'POST', body: form });
    const payload = await response.json().catch(() => ({}));
    setSending(false);
    if (!response.ok) {
      setError(payload.error || 'Email could not be sent.');
      return;
    }
    setCompose(null);
    setFiles([]);
    await load(data.selectedMailboxId, payload.threadId);
  }

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600">
        Loading Elevate Email…
      </div>
    );
  }

  if (!data?.mailboxes.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Mail className="mx-auto h-10 w-10 text-slate-400" />
        <h2 className="mt-4 text-xl font-black text-slate-950">No active Elevate mailbox</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
          Personal email is limited to active staff. Approved Program Holders and Host Shops receive
          their organization mailbox automatically.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-950"
        >
          {error}
        </div>
      ) : null}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col border-b border-slate-200 bg-slate-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-200">
              Elevate Communications Hub
            </p>
            <h1 className="mt-1 text-2xl font-black">Email</h1>
            <p className="mt-1 text-sm text-slate-300">{selectedMailbox?.address}</p>
          </div>
          <div className="mt-4 flex gap-2 sm:mt-0">
            <button
              type="button"
              onClick={() => void load(data.selectedMailboxId, data.selectedThread?.id)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-bold"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                setCompose({ ...EMPTY_COMPOSE });
                setFiles([]);
              }}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-black text-white"
            >
              <Plus className="h-4 w-4" /> Compose
            </button>
          </div>
        </div>

        <div className="grid min-h-[620px] lg:grid-cols-[240px_330px_minmax(0,1fr)]">
          <aside className="border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r">
            <p className="px-2 py-2 text-xs font-black uppercase tracking-wider text-slate-500">
              Mailboxes
            </p>
            <div className="space-y-1">
              {data.mailboxes.map((mailbox) => (
                <button
                  key={mailbox.id}
                  type="button"
                  onClick={() => void load(mailbox.id)}
                  className={`w-full rounded-xl px-3 py-3 text-left ${mailbox.id === data.selectedMailboxId ? 'bg-blue-700 text-white' : 'text-slate-800 hover:bg-white'}`}
                >
                  <span className="block truncate text-sm font-black">{mailbox.displayName}</span>
                  <span
                    className={`mt-0.5 block truncate text-xs ${mailbox.id === data.selectedMailboxId ? 'text-blue-100' : 'text-slate-500'}`}
                  >
                    {mailbox.address}
                  </span>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${mailbox.id === data.selectedMailboxId ? 'bg-white/15 text-white' : 'bg-slate-200 text-slate-700'}`}
                  >
                    {mailboxLabel(mailbox.mailboxKind)}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section
            className={`border-b border-slate-200 lg:border-b-0 lg:border-r ${data.selectedThread ? 'hidden lg:block' : 'block'}`}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 p-4">
              <Inbox className="h-4 w-4 text-slate-500" />
              <h2 className="font-black text-slate-950">Inbox</h2>
              <span className="ml-auto text-xs font-bold text-slate-500">
                {data.threads.length}
              </span>
            </div>
            {data.threads.length ? (
              <div className="divide-y divide-slate-100">
                {data.threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => void openThread(thread.id)}
                    className={`w-full px-4 py-4 text-left hover:bg-blue-50 ${data.selectedThread?.id === thread.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${thread.unread ? 'bg-blue-600' : 'bg-slate-300'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${thread.unread ? 'font-black text-slate-950' : 'font-bold text-slate-700'}`}
                        >
                          {thread.subject}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {thread.message_count} message{thread.message_count === 1 ? '' : 's'} ·{' '}
                          {formatDate(thread.last_message_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm font-medium text-slate-500">
                No messages yet.
              </div>
            )}
          </section>

          <section className={`${data.selectedThread ? 'block' : 'hidden lg:block'} min-w-0`}>
            {data.selectedThread ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200 p-4">
                  <button
                    type="button"
                    onClick={() => void load(data.selectedMailboxId)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 lg:hidden"
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h2 className="min-w-0 flex-1 truncate font-black text-slate-950">
                    {data.selectedThread.subject}
                  </h2>
                  <button
                    type="button"
                    onClick={startReply}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white"
                  >
                    <Reply className="h-4 w-4" /> Reply
                  </button>
                </div>
                <div className="max-h-[555px] space-y-4 overflow-y-auto bg-slate-50 p-4 sm:p-6">
                  {data.selectedThread.messages.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-3xl rounded-2xl border p-4 shadow-sm ${message.direction === 'outbound' ? 'ml-auto border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {message.sender_name || message.sender_email}
                          </p>
                          <p className="text-xs text-slate-500">{message.sender_email}</p>
                        </div>
                        <p className="text-xs font-semibold text-slate-500">
                          {formatDate(message.sent_at || message.received_at || message.created_at)}
                        </p>
                      </div>
                      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                        {message.text_body || '(No text content)'}
                      </p>
                      {message.attachments?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={`${apiPath}?attachmentId=${encodeURIComponent(attachment.id)}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-blue-800"
                            >
                              <FileText className="h-4 w-4" /> {attachment.file_name}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {message.status === 'failed' ? (
                        <p className="mt-3 text-xs font-black text-red-700">Delivery failed</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-[620px] flex-col items-center justify-center p-8 text-center">
                <Mail className="h-12 w-12 text-slate-300" />
                <h2 className="mt-4 text-lg font-black text-slate-900">Select a conversation</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Or compose a new email from this mailbox.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>

      {compose ? (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Compose email"
        >
          <form
            onSubmit={sendMessage}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  {compose.threadId ? 'Reply' : 'New email'}
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  From {selectedMailbox?.address}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompose(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300"
                aria-label="Close composer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block text-sm font-black text-slate-800">
                To
                <input
                  required
                  type="text"
                  value={compose.to}
                  onChange={(event) => setCompose({ ...compose, to: event.target.value })}
                  placeholder="name@example.com"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-medium"
                />
              </label>
              <label className="block text-sm font-black text-slate-800">
                Subject
                <input
                  required
                  type="text"
                  value={compose.subject}
                  onChange={(event) => setCompose({ ...compose, subject: event.target.value })}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-medium"
                />
              </label>
              <label className="block text-sm font-black text-slate-800">
                Message
                <textarea
                  value={compose.body}
                  onChange={(event) => setCompose({ ...compose, body: event.target.value })}
                  rows={9}
                  className="mt-2 w-full rounded-xl border border-slate-300 p-4 font-medium"
                />
              </label>
              <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-400 px-4 text-sm font-bold text-slate-700">
                <Paperclip className="h-4 w-4" /> Attach files
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(event) => setFiles(Array.from(event.target.files || []))}
                />
              </label>
              {files.length ? (
                <p className="text-xs font-semibold text-slate-600">
                  {files.map((file) => file.name).join(', ')}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setCompose(null)}
                className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-black"
              >
                Cancel
              </button>
              <button
                disabled={sending}
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-black text-white disabled:opacity-60"
              >
                <Send className="h-4 w-4" /> {sending ? 'Sending…' : 'Send email'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
