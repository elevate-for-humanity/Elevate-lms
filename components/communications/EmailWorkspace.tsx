'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Archive,
  Star,
  Trash2,
  Search,
  Folder,
  MailOpen,
  Mic,
  MicOff,
  ArrowLeft,
  FileText,
  Inbox,
  Mail,
  Paperclip,
  Plus,
  RefreshCw,
  Reply,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';

import { createBrowserSpeechRecognition, type BrowserSpeechRecognition } from '@/lib/browser/speech-recognition';

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
  starred: boolean;
  folder: string;
  custom_folder_id?: string | null;
};
type Attachment = { id: string; file_name: string; mime_type: string; size_bytes: number };
type Message = {
  id: string;
  direction: 'inbound' | 'outbound';
  status: string;
  sender_email: string;
  reply_to?: string;
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
  readOnly?: boolean;
  isAdmin?: boolean;
  meetings?: { id: string; title: string; scheduled_at?: string }[];
  directory?: { id: string; address: string; display_name: string; mailbox_kind: string }[];
  mailboxes: Mailbox[];
  selectedMailboxId: string | null;
  filters: {
    id: string;
    field: string;
    contains: string;
    action: string;
    folder_id?: string;
    enabled: boolean;
  }[];
  folders: { id: string; name: string }[];
  drafts: {
    id: string;
    thread_id?: string;
    to_text: string;
    cc_text: string;
    bcc_text: string;
    subject: string;
    body: string;
    updated_at: string;
  }[];
  threads: Thread[];
  selectedThread?: (Thread & { messages: Message[] }) | null;
};
type ComposeState = {
  broadcast?: boolean;
  campaignKey?: string;
  draftId?: string;
  threadId?: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
};

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
  roleLabel = 'Program Holder',
  initialRecipient,
  initialSubject = '',
  communicationLinks,
}: {
  apiPath?: string;
  initialMailboxId?: string;
  roleLabel?: string;
  initialRecipient?: string;
  initialSubject?: string;
  communicationLinks?: { phone: string; chat: string; calendar: string };
}) {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compose, setCompose] = useState<ComposeState | null>(null);
  const initialComposeOpened = useRef(false);
  useEffect(() => {
    if (
      !data ||
      data.readOnly ||
      !data.selectedMailboxId ||
      !initialRecipient ||
      initialComposeOpened.current
    )
      return;
    initialComposeOpened.current = true;
    setCompose({ to: initialRecipient, subject: initialSubject, body: '' });
  }, [data, initialRecipient, initialSubject]);
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const speechRef = useRef<BrowserSpeechRecognition | null>(null);
  useEffect(() => () => speechRef.current?.stop(), []);
  function toggleDictation() {
    if (listening) { speechRef.current?.stop(); setListening(false); return; }
    const recognition = createBrowserSpeechRecognition();
    if (!recognition) { setSpeechError('Voice dictation is unavailable in this browser.'); return; }
    setSpeechError('');
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const phrases: string[] = [];
      for (let i = event.resultIndex ?? 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) phrases.push(event.results[i][0].transcript);
      }
      const words = phrases.join(' ').trim();
      if (words) setCompose(previous => previous ? { ...previous, body: [previous.body.trimEnd(), words].filter(Boolean).join(' ') } : previous);
    };
    recognition.onerror = (event) => {
      setSpeechError(event.error === 'not-allowed' ? 'Microphone permission denied.' : 'Dictation stopped. Try again.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    try { recognition.start(); speechRef.current = recognition; setListening(true); }
    catch { setSpeechError('Unable to start microphone.'); }
  }
  const [filterEditor, setFilterEditor] = useState(false);
  const [filter, setFilter] = useState({
    field: 'subject',
    contains: '',
    filterAction: 'folder',
    folderId: '',
  });
  const [view, setView] = useState('inbox');
  const viewRef = useRef('inbox');
  const searchRef = useRef('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [folderEditor, setFolderEditor] = useState<{ id?: string; name: string } | null>(null);
  const [confirmFolder, setConfirmFolder] = useState<{ id: string; name: string } | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(
    async (mailboxId?: string | null, threadId?: string | null) => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (mailboxId) params.set('mailboxId', mailboxId);
      if (threadId) params.set('threadId', threadId);
      params.set('view', viewRef.current);
      if (searchRef.current) params.set('q', searchRef.current);
      try {
        const response = await fetch(`${apiPath}?${params.toString()}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) setError(payload.error || 'Email could not be loaded.');
        else setData(payload);
      } catch {
        setError('Email could not be loaded. Try Refresh.');
      }
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
    if (!data.readOnly) {
      void fetch(apiPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId }),
      });
    }
  }

  function startReply() {
    if (data?.readOnly) return;
    const messages = data?.selectedThread?.messages ?? [];
    const lastInbound = [...messages].reverse().find((message) => message.direction === 'inbound');
    const recipient =
      lastInbound?.reply_to ||
      lastInbound?.sender_email ||
      messages.at(-1)?.to_addresses?.[0] ||
      '';
    setCompose({
      threadId: data?.selectedThread?.id,
      to: recipient,
      subject: `Re: ${(data?.selectedThread?.subject || '').replace(/^(re:\s*)+/i, '')}`,
      body: '',
    });
    setFiles([]);
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!compose || !data?.selectedMailboxId) return;
    if (data.readOnly) {
      setCompose(null);
      setError(
        `Administrator portal previews are read-only. Sign in as the ${roleLabel} to send email.`,
      );
      return;
    }
    speechRef.current?.stop();
    setListening(false);
    setSending(true);
    setError('');
    const form = new FormData();
    form.set('mailboxId', data.selectedMailboxId);
    form.set('to', compose.to);
    if (compose.broadcast) {
      form.set('broadcast', 'true');
      form.set('campaignKey', compose.campaignKey || window.crypto.randomUUID());
    }
    form.set('subject', compose.subject);
    form.set('cc', compose.cc || '');
    form.set('bcc', compose.bcc || '');
    if (compose.draftId) form.set('draftId', compose.draftId);
    form.set('body', compose.body);
    if (compose.threadId) form.set('threadId', compose.threadId);
    files.forEach((file) => form.append('attachments', file));
    try {
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
      if (payload.warning) setError(payload.warning);
      else
        setNotice(
          payload.queued
            ? `${payload.queued} emails queued. Delivery status appears in Sent when accepted by the provider.`
            : 'Email sent.',
        );
    } catch {
      setError('Send result is unknown. Refresh before resending to avoid duplicates.');
    } finally {
      setSending(false);
    }
  }

  async function manage(action: string, extra: Record<string, unknown> = {}) {
    if (!data?.selectedMailboxId || data.readOnly || busy) return null;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(apiPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, mailboxId: data.selectedMailboxId, ...extra }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Mailbox update failed.');
        return null;
      }
      setSelected([]);
      await load(data.selectedMailboxId);
      return result;
    } catch {
      setError('Mailbox update failed. Please refresh.');
      return null;
    } finally {
      setBusy(false);
    }
  }
  function chooseView(next: string, mailboxId = data?.selectedMailboxId) {
    viewRef.current = next;
    setView(next);
    setSelected([]);
    void load(mailboxId);
  }
  async function saveDraft() {
    if (!compose) return;
    const result = await manage('saveDraft', { ...compose });
    if (result) {
      setCompose(null);
      setFiles([]);
      setNotice('Draft saved. Reattach files when you reopen it.');
    }
  }
  function forward() {
    const message = data?.selectedThread?.messages.at(-1);
    if (!message) return;
    setCompose({
      to: '',
      subject: `Fwd: ${data?.selectedThread?.subject}`,
      body: `\n\n---------- Forwarded message ----------\nFrom: ${message.sender_email}\nDate: ${formatDate(message.created_at)}\nSubject: ${message.subject}\n\n${message.text_body}`,
    });
    setFiles([]);
    setNotice('Forward includes message text. Download and attach any files you want to forward.');
  }
  const selection = selected.length
    ? selected
    : data?.selectedThread
      ? [data.selectedThread.id]
      : [];
  const viewName =
    data?.folders?.find((f) => `folder:${f.id}` === view)?.name ||
    (
      {
        inbox: 'Inbox',
        sent: 'Sent',
        starred: 'Starred',
        archive: 'Archive',
        spam: 'Spam',
        trash: 'Trash',
        all: 'All mail',
        drafts: 'Drafts',
      } as Record<string, string>
    )[view] ||
    'Inbox';

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-600">
        Loading Elevate Email…
      </div>
    );
  }

  if (error && !data) {
    return (
      <section role="alert" className="rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="text-xl font-bold">Email could not be loaded</h2>
        <p className="mt-2">{error}</p>
        <button type="button" onClick={() => void load(initialMailboxId)} className="mt-4 min-h-11 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Retry email</button>
      </section>
    );
  }

  if (!data?.mailboxes.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Mail className="mx-auto h-10 w-10 text-slate-400" />
        <h2 className="mt-4 text-xl font-black text-slate-950">No active Elevate mailbox</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
          Active staff, learners, and apprentices receive personal email. Approved Program Holders
          and Host Shops receive their organization mailbox automatically.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {data.isAdmin && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            const result = await manage('sendQueued');
            if (result)
              setNotice(
                `${result.sent} queued emails sent; ${result.failed} failed. Refresh Sent to review delivery status.`,
              );
          }}
          className="min-h-11 rounded-lg border bg-white px-4 font-bold"
        >
          Send queued emails
        </button>
      )}
      {notice ? (
        <p
          role="status"
          className="rounded-xl border border-blue-200 bg-blue-50 p-3 font-semibold text-blue-950"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-950"
        >
          {error}
        </div>
      ) : null}
      {data.readOnly ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-bold text-amber-950">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          Administrator preview is read-only. You can inspect the selected {roleLabel} mailbox, but
          only an authorized {roleLabel} user can compose, reply, or mark messages as read.
        </div>
      ) : null}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col border-b border-slate-200 bg-slate-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-200">
              Elevate Communications Hub
            </p>
            <h1 className="mt-1 text-2xl font-black">Email</h1>
            <p className="mt-2 text-sm text-white">
              Contact Admin: admissions@elevateforhumanity.org
            </p>
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
            {data.readOnly ? (
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-black text-amber-950">
                <ShieldCheck className="h-4 w-4" /> Read-only preview
              </span>
            ) : (
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
            )}
          </div>
        </div>

        <nav
          aria-label="Communication tools"
          className="flex gap-3 overflow-x-auto border-b border-slate-200 bg-white p-3 text-sm font-bold"
        >
          <a
            className="shrink-0 rounded-lg border px-3 py-2"
            href={communicationLinks?.phone ?? (data.isAdmin ? '/phone/inbox' : '/communications/phone')}
          >
            Phone inbox
          </a>
          <a
            className="shrink-0 rounded-lg border px-3 py-2"
            href={
              communicationLinks?.chat ?? (data.isAdmin
                ? '/staff-portal/messages'
                : 'https://app.elevateforhumanity.org/lms/messages')
            }
          >
            Chat
          </a>
          <a
            className="shrink-0 rounded-lg border px-3 py-2"
            href={
              communicationLinks?.calendar ?? (data.isAdmin ? '/phone/meetings' : 'https://app.elevateforhumanity.org/lms/calendar')
            }
          >
            Calendar
          </a>
          {data.isAdmin && (
            <a className="shrink-0 rounded-lg border px-3 py-2" href="/phone/meetings">
              Video meetings & group conferences
            </a>
          )}
          <a
            className="shrink-0 rounded-lg border px-3 py-2"
            href={data.isAdmin ? '/phone/texts' : '/communications/texts'}
          >
            Text messages
          </a>
        </nav>
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
                  onClick={() => chooseView('inbox', mailbox.id)}
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
            <nav
              aria-label="Mail folders"
              className="mt-5 space-y-1 border-t border-slate-200 pt-3"
            >
              {Object.entries({
                inbox: 'Inbox',
                starred: 'Starred',
                sent: 'Sent',
                drafts: 'Drafts',
                archive: 'Archive',
                all: 'All mail',
                spam: 'Spam',
                trash: 'Trash',
              }).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => chooseView(key)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-bold ${view === key ? 'bg-blue-100 text-blue-900' : 'text-slate-700 hover:bg-white'}`}
                >
                  {label}
                </button>
              ))}
              {!data.readOnly && (
                <button
                  type="button"
                  onClick={() => setFilterEditor(true)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-blue-800"
                >
                  Filters & copy rules
                </button>
              )}
              <p className="px-3 pt-3 text-xs font-bold uppercase text-slate-500">Folders</p>
              {(data.folders || []).map((folder) => (
                <div className="flex items-center" key={folder.id}>
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm font-bold text-slate-800"
                    onClick={() => chooseView(`folder:${folder.id}`)}
                  >
                    {folder.name}
                  </button>
                  {!data.readOnly && (
                    <>
                      <button
                        type="button"
                        aria-label={`Rename ${folder.name}`}
                        onClick={() => setFolderEditor(folder)}
                        className="p-2 text-xs text-blue-800"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete folder ${folder.name}`}
                        onClick={() => setConfirmFolder(folder)}
                        className="p-2 text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {!data.readOnly && (
                <button
                  type="button"
                  onClick={() => setFolderEditor({ name: '' })}
                  className="flex items-center gap-2 px-3 py-3 text-sm font-bold text-blue-800"
                >
                  <Plus className="h-4 w-4" />
                  New folder
                </button>
              )}
            </nav>
          </aside>

          <section
            className={`border-b border-slate-200 lg:border-b-0 lg:border-r ${data.selectedThread ? 'hidden lg:block' : 'block'}`}
          >
            <div className="flex items-center gap-2 border-b border-slate-200 p-4">
              <Inbox className="h-4 w-4 text-slate-500" />
              <h2 className="font-black text-slate-950">{viewName}</h2>
              <span className="ml-auto text-xs font-bold text-slate-500">
                {data.threads.length}
              </span>
            </div>
            <form
              className="flex gap-2 border-b border-slate-200 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                searchRef.current = search;
                void load(data.selectedMailboxId);
              }}
            >
              <input
                aria-label="Search mail"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search messages"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 p-2 text-sm text-slate-950"
              />
              <button
                type="submit"
                aria-label="Search messages"
                className="rounded-lg border border-slate-300 p-2"
              >
                <Search className="h-4 w-4" />
              </button>
              {searchRef.current && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    searchRef.current = '';
                    void load(data.selectedMailboxId);
                  }}
                  className="text-xs font-bold"
                >
                  Clear
                </button>
              )}
            </form>
            {!data.readOnly && view !== 'drafts' && (
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
                <input
                  type="checkbox"
                  aria-label="Select up to 100 conversations"
                  checked={
                    data.threads.length > 0 &&
                    selected.length === Math.min(100, data.threads.length)
                  }
                  onChange={(e) =>
                    setSelected(e.target.checked ? data.threads.slice(0, 100).map((t) => t.id) : [])
                  }
                />
                <span className="text-xs text-slate-600">{selection.length} selected</span>
                <button
                  type="button"
                  title="Archive"
                  aria-label="Archive selected"
                  disabled={!selection.length || busy}
                  onClick={() => void manage('move', { threadIds: selection, folder: 'archive' })}
                  className="rounded p-2 disabled:opacity-40"
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Move to Trash"
                  aria-label="Trash selected"
                  disabled={!selection.length || busy}
                  onClick={() => void manage('move', { threadIds: selection, folder: 'trash' })}
                  className="rounded p-2 text-red-800 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!selection.length || busy}
                  onClick={() => void manage('unread', { threadIds: selection })}
                  className="text-xs font-bold disabled:opacity-40"
                >
                  Unread
                </button>
                <button
                  type="button"
                  disabled={!selection.length || busy}
                  onClick={() => void manage('read', { threadIds: selection })}
                  className="text-xs font-bold disabled:opacity-40"
                >
                  Read
                </button>
                <select
                  aria-label="Move selected to folder"
                  disabled={!selection.length || busy}
                  value=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value)
                      void manage('move', {
                        threadIds: selection,
                        ...(value.startsWith('folder:')
                          ? { folderId: value.slice(7), folder: 'inbox' }
                          : { folder: value }),
                      });
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-950"
                >
                  <option value="">Move to…</option>
                  <option value="inbox">Inbox / Restore</option>
                  <option value="archive">Archive</option>
                  <option value="spam">Spam</option>
                  <option value="trash">Trash</option>
                  {(data.folders || []).map((f) => (
                    <option key={f.id} value={`folder:${f.id}`}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {view === 'trash' && (
              <p className="p-3 text-xs text-slate-600">
                Messages remain recoverable. Select a conversation and choose Inbox / Restore.
              </p>
            )}
            {view === 'drafts' ? (
              <div className="divide-y divide-slate-100">
                {(data.drafts || []).map((draft) => (
                  <div key={draft.id} className="flex gap-2 p-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setCompose({
                          draftId: draft.id,
                          threadId: draft.thread_id,
                          to: draft.to_text,
                          cc: draft.cc_text,
                          bcc: draft.bcc_text,
                          subject: draft.subject,
                          body: draft.body,
                        });
                        setFiles([]);
                      }}
                    >
                      <p className="truncate font-bold text-slate-900">
                        {draft.subject || '(No subject)'}
                      </p>
                      <p className="truncate text-xs text-slate-600">
                        {draft.to_text} · {formatDate(draft.updated_at)}
                      </p>
                    </button>
                    {!data.readOnly && (
                      <button
                        type="button"
                        aria-label={`Delete draft ${draft.subject}`}
                        onClick={() => void manage('deleteDraft', { draftId: draft.id })}
                        className="p-2 text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {!data.drafts?.length && (
                  <p className="p-6 text-sm text-slate-600">No saved drafts.</p>
                )}
              </div>
            ) : data.threads.length ? (
              <div className="divide-y divide-slate-100">
                {data.threads.map((thread) => (
                  <div key={thread.id} className="flex items-center">
                    {!data.readOnly && (
                      <input
                        type="checkbox"
                        aria-label={`Select ${thread.subject}`}
                        className="ml-3"
                        checked={selected.includes(thread.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, thread.id].slice(0, 100)
                              : selected.filter((id) => id !== thread.id),
                          )
                        }
                      />
                    )}
                    {!data.readOnly && (
                      <button
                        type="button"
                        aria-label={`${thread.starred ? 'Unstar' : 'Star'} ${thread.subject}`}
                        onClick={() =>
                          void manage('star', { threadIds: [thread.id], starred: !thread.starred })
                        }
                        className="p-2 text-amber-600"
                      >
                        <Star className={`h-4 w-4 ${thread.starred ? 'fill-amber-400' : ''}`} />
                      </button>
                    )}
                    <button
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
                  </div>
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
                  {!data.readOnly ? (
                    <>
                      <button
                        type="button"
                        onClick={forward}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800"
                      >
                        Forward
                      </button>
                      <button
                        type="button"
                        onClick={startReply}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-black text-white"
                      >
                        <Reply className="h-4 w-4" /> Reply
                      </button>
                    </>
                  ) : null}
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
                  {data.readOnly
                    ? `Choose a conversation to inspect this ${roleLabel} mailbox.`
                    : 'Or compose a new email from this mailbox.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </section>

      {filterEditor && (
        <div
          role="dialog"
          aria-label="Mail filters"
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Filters & copy rules</h2>
            <p className="mt-2 text-sm text-slate-700">
              New incoming messages use these rules in order. Skip prevents a copy from being stored
              in this mailbox. Rules do not delete the original email.
            </p>
            <ul className="my-4 space-y-3">
              {(data.filters || [])
                .filter((f) => f.enabled)
                .map((rule) => (
                  <li
                    key={rule.id}
                    className="flex items-center justify-between gap-3 rounded border p-3 text-sm"
                  >
                    <span>
                      {rule.field} contains “{rule.contains}” →{' '}
                      {rule.action === 'folder'
                        ? data.folders.find((f) => f.id === rule.folder_id)?.name
                        : rule.action}
                    </span>
                    <button
                      type="button"
                      onClick={() => void manage('disableFilter', { filterId: rule.id })}
                      className="font-bold text-red-800"
                    >
                      Disable
                    </button>
                  </li>
                ))}
            </ul>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await manage('createFilter', filter)) {
                  setFilter({ ...filter, contains: '' });
                }
              }}
            >
              <label className="block text-sm font-bold">
                Match
                <select
                  aria-label="Filter match field"
                  value={filter.field}
                  onChange={(e) => setFilter({ ...filter, field: e.target.value })}
                  className="ml-2 rounded border p-2"
                >
                  <option value="subject">Subject</option>
                  <option value="sender">Sender</option>
                  <option value="body">Message text</option>
                </select>
              </label>
              <input
                aria-label="Filter contains"
                placeholder="Contains these words or address"
                required
                maxLength={160}
                value={filter.contains}
                onChange={(e) => setFilter({ ...filter, contains: e.target.value })}
                className="w-full rounded-lg border p-3"
              />
              <select
                aria-label="Filter action"
                value={filter.filterAction}
                onChange={(e) => setFilter({ ...filter, filterAction: e.target.value })}
                className="w-full rounded-lg border p-3"
              >
                <option value="folder">Move to folder</option>
                <option value="skip">Do not copy into this mailbox</option>
                <option value="archive">Archive</option>
                <option value="spam">Spam</option>
              </select>
              {filter.filterAction === 'folder' && (
                <select
                  aria-label="Filter destination folder"
                  required
                  value={filter.folderId}
                  onChange={(e) => setFilter({ ...filter, folderId: e.target.value })}
                  className="w-full rounded-lg border p-3"
                >
                  <option value="">Choose folder</option>
                  {data.folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white"
              >
                Add filter
              </button>
              <button
                type="button"
                onClick={() => setFilterEditor(false)}
                className="ml-3 rounded-lg border px-4 py-2"
              >
                Close
              </button>
            </form>
          </div>
        </div>
      )}
      {folderEditor && (
        <div
          role="dialog"
          aria-label="Folder name"
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4"
        >
          <form
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await manage(folderEditor.id ? 'renameFolder' : 'createFolder', {
                  folderId: folderEditor.id,
                  name: folderEditor.name,
                })
              )
                setFolderEditor(null);
            }}
          >
            <h2 className="text-xl font-bold">
              {folderEditor.id ? 'Rename folder' : 'New folder'}
            </h2>
            <input
              aria-label="Folder name"
              required
              maxLength={80}
              value={folderEditor.name}
              onChange={(e) => setFolderEditor({ ...folderEditor, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-3"
            />
            <button
              type="button"
              onClick={() => setFolderEditor(null)}
              className="mr-3 rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-blue-700 px-4 py-2 font-bold text-white"
            >
              Save folder
            </button>
          </form>
        </div>
      )}
      {confirmFolder && (
        <div
          role="dialog"
          aria-label="Delete folder"
          aria-modal="true"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-4"
        >
          <div className="max-w-md space-y-4 rounded-2xl bg-white p-6">
            <h2 className="text-xl font-bold">Delete {confirmFolder.name}?</h2>
            <p>Messages in this folder will move back to Inbox. No emails will be deleted.</p>
            <button
              type="button"
              onClick={() => setConfirmFolder(null)}
              className="mr-3 rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (await manage('deleteFolder', { folderId: confirmFolder.id })) {
                  setConfirmFolder(null);
                  chooseView('inbox');
                }
              }}
              className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white"
            >
              Delete folder
            </button>
          </div>
        </div>
      )}
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
              {!compose.broadcast && (
                <label className="block text-sm font-black text-slate-800">
                  Choose a student or office contact
                  <select
                    aria-label="Choose a student or office contact"
                    value=""
                    className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3"
                    onChange={(event) => {
                      const address = event.target.value;
                      if (!address) return;
                      const current = compose.to
                        .split(/[,;]+/)
                        .map((value) => value.trim())
                        .filter(Boolean);
                      if (!current.some((value) => value.toLowerCase() === address.toLowerCase()))
                        setCompose({ ...compose, to: [...current, address].join(', ') });
                    }}
                  >
                    <option value="">Select a recipient to add</option>
                    {(data.directory || []).map((person) => (
                      <option key={person.id} value={person.address}>
                        {person.display_name} — {person.address}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-sm font-black text-slate-800">
                To
                <input
                  required={!compose.broadcast}
                  disabled={compose.broadcast}
                  list="interoffice-recipient-directory"
                  type="text"
                  value={compose.to}
                  onChange={(event) => setCompose({ ...compose, to: event.target.value })}
                  placeholder="name@example.com"
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 font-medium"
                />
              </label>
              {data.isAdmin && (
                <label className="block text-sm font-bold text-slate-800">
                  Insert video meeting invitation
                  <select
                    aria-label="Insert meeting invitation"
                    value=""
                    onChange={(e) => {
                      const meeting = data.meetings?.find((m) => m.id === e.target.value);
                      if (meeting)
                        setCompose({
                          ...compose,
                          subject: compose.subject || meeting.title,
                          body:
                            compose.body +
                            `\n\nYou are invited to ${meeting.title}.${meeting.scheduled_at ? '\nStart: ' + new Date(meeting.scheduled_at).toLocaleString() : ''}\nJoin: https://app.elevateforhumanity.org/communications/meetings/${meeting.id}\nAdmin host link: https://admin.elevateforhumanity.org/phone/meetings/${meeting.id}\nSign in with your Elevate account.`,
                        });
                    }}
                    className="mt-2 w-full rounded-lg border p-3"
                  >
                    <option value="">Choose a meeting</option>
                    {(data.meetings || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                  <a className="mt-2 inline-block font-bold text-blue-800" href="/phone/meetings">
                    Create a meeting or group conference
                  </a>
                </label>
              )}
              <datalist id="interoffice-recipient-directory">
                {(data.directory || []).map((p) => (
                  <option key={p.id} value={p.address}>
                    {p.display_name} · {p.mailbox_kind}
                  </option>
                ))}
              </datalist>
              {data.isAdmin && (
                <label className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 font-bold text-blue-950">
                  <input
                    type="checkbox"
                    checked={!!compose.broadcast}
                    onChange={(e) =>
                      setCompose({
                        ...compose,
                        broadcast: e.target.checked,
                        campaignKey: compose.campaignKey || window.crypto.randomUUID(),
                      })
                    }
                  />
                  Email everyone with an active interoffice account (individual delivery)
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {(['cc', 'bcc'] as const).map((field) => (
                  <label key={field} className="block text-sm font-bold text-slate-800">
                    {field.toUpperCase()}
                    <input
                      type="text"
                      value={compose[field] || ''}
                      onChange={(e) => setCompose({ ...compose, [field]: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                    />
                  </label>
                ))}
              </div>
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
              <button type="button" onClick={toggleDictation}
                aria-label={listening ? 'Stop voice dictation' : 'Dictate email message'}
                aria-pressed={listening}
                className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold">
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {listening ? 'Stop dictation' : 'Dictate message'}
              </button>
              {speechError && <p role="alert" className="text-sm text-red-700">{speechError}</p>}
              <p className="text-xs text-slate-600">Review your message and recipients before sending.</p>
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
                type="button"
                disabled={busy || sending}
                onClick={() => void saveDraft()}
                className="rounded-xl border border-slate-300 px-4 text-sm font-bold"
              >
                Save draft
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
