import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';
import { holderCallOutcome, loadPhoneInbox, resolvePhoneInboxScope } from './data';

export const dynamic = 'force-dynamic';

function date(value?: string) {
  return value ? new Date(value).toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' }) : 'Not recorded';
}
function owner(item: any) {
  return item.extension ? `${item.extension.display_name || 'Assigned holder'} · extension ${item.extension.extension}` : 'Unassigned';
}
function Recording({ url }: { url?: string }) {
  return url ? <audio controls preload="none" src={url} className="mt-3 w-full" aria-label="Play voicemail or call recording" /> : null;
}

export default async function PhoneInboxPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const db = await requireAdminClient();
  const scope = await resolvePhoneInboxScope(db, auth);
  const requestedPage = Number((await searchParams)?.page || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const { calls, callbacks, voicemails, texts, hasMore } = await loadPhoneInbox(db, scope, page);

  return (
    <main className="mx-auto max-w-6xl space-y-6 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-600">Elevate Communications</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Phone inbox & messages</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{scope.oversight
            ? 'Admin receives a copy of every call and voicemail here. The assigned program holder remains responsible for callbacks. Their status updates appear in this same record.'
            : 'Your calls, voicemail, and callback follow-up.'}</p>
        </div>
        <nav aria-label="Communications" className="flex flex-wrap gap-2">
          <Link href="/phone" className="rounded-xl border bg-white px-4 py-2 text-sm font-black">Phone</Link>
          <Link href="/phone/email" className="rounded-xl border bg-white px-4 py-2 text-sm font-black">Email</Link>
          <Link href="/operations/sms-logs" className="rounded-xl border bg-white px-4 py-2 text-sm font-black">Texts</Link>
          <Link href={`/phone/inbox?page=${page}`} className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-black text-white">Refresh status</Link>
        </nav>
      </div>

      <section className="rounded-2xl border bg-white p-4">
        <h2 className="text-xl font-black">Call history — Admin copy</h2>
        <p className="mt-1 text-sm text-slate-600">Caller, time, assigned holder, answer outcome, and linked follow-up. A status marked contacted is reported by the holder.</p>
        <div className="mt-4 space-y-3">{calls.length ? calls.map((item: any) => (
          <article id={`call-${item.id}`} key={item.id} className="rounded-xl border bg-slate-50 p-3 text-sm">
            <p className="font-bold">{item.from_number || 'Unknown caller'} → {item.to_number || 'Elevate'}</p>
            <p>{date(item.started_at || item.created_at)} ET · {item.direction} · {holderCallOutcome(item)}</p>
            <p className="mt-1 font-semibold">Assigned: {owner(item)}</p>
            <p className="text-slate-600">Call reference: {item.id}</p>
            <p>Voicemail: {item.voicemails?.length ? 'Message saved' : 'No voicemail saved'}</p>
            {item.duration_seconds != null && <p>Duration: {item.duration_seconds} seconds</p>}
            {(item.callbacks ?? []).map((task: any) => <p key={task.id}>Callback: <strong>{task.status}</strong> · {task.source === 'voicemail' ? 'Voicemail task' : 'PARIS task'} · Updated {date(task.updated_at)} ET</p>)}
            <Recording url={item.recording_url} />
          </article>
        )) : <p className="text-sm text-slate-500">No calls on this page.</p>}</div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-xl font-black">Callback oversight</h2>
          <div className="mt-3 space-y-3">{callbacks.length ? callbacks.map((item: any) => (
            <article key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-bold">{item.caller_name || item.callback_number || 'Caller'}</p>
              <p>{item.callback_number} · {date(item.created_at)} ET</p>
              <p className="mt-1 font-semibold">Assigned: {owner(item)}</p>
              <p>Status: <strong>{item.status}</strong> · Updated {date(item.updated_at)} ET</p>
              <p>{item.program_or_department}</p>
              <p className="mt-2 whitespace-pre-wrap break-words">{item.summary || item.reason || 'Awaiting caller details'}</p>
              {item.transcript && <details className="mt-2 rounded-lg border bg-white p-2"><summary className="cursor-pointer font-bold">Read message transcript</summary><p className="mt-2 whitespace-pre-wrap break-words">{item.transcript}</p></details>}
              <p className="mt-2 text-slate-600">Linked call: {item.call_id} · Initiated {date(item.call?.started_at)} ET</p>
              <Recording url={item.recording_url} />
            </article>
          )) : <p className="text-sm text-slate-500">No callback items on this page.</p>}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-xl font-black">Voicemail copies</h2>
          <div className="mt-3 space-y-3">{voicemails.length ? voicemails.map((item: any) => (
            <article key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-bold">{item.phone_number || 'Unknown caller'}</p>
              <p>{date(item.created_at)} ET · {item.duration_seconds ?? 'Unknown'} seconds</p>
              <p className="mt-1 font-semibold">Assigned: {owner(item)}</p>
              <p className="mt-2 whitespace-pre-wrap break-words">{item.transcription || item.summary || 'Voicemail received; transcript not yet available.'}</p>
              <p className="mt-2 text-slate-600">Linked call: {item.call_id || 'Legacy voicemail'} · Initiated {date(item.call?.started_at)} ET</p>
              {(item.call?.callbacks ?? []).filter((task: any) => task.source === 'voicemail').map((task: any) => <p key={task.id}>Callback: <strong>{task.status}</strong> · Updated {date(task.updated_at)} ET</p>)}
              <Recording url={item.recording_url} />
            </article>
          )) : <p className="text-sm text-slate-500">No voicemail on this page.</p>}</div>
        </div>
      </section>
      {texts.length > 0 && <section className="rounded-2xl border bg-white p-4"><h2 className="font-black">Texts</h2>{texts.map((item: any) => <p key={item.id} className="mt-3 whitespace-pre-wrap text-sm">{item.body}</p>)}</section>}
      <nav aria-label="Inbox pages" className="flex items-center gap-4">
        {page > 1 && <Link className="rounded-lg border bg-white px-4 py-2" href={`/phone/inbox?page=${page - 1}`}>Newer records</Link>}
        <span>Page {page}</span>
        {hasMore && <Link className="rounded-lg border bg-white px-4 py-2" href={`/phone/inbox?page=${page + 1}`}>Older records</Link>}
      </nav>
    </main>
  );
}
