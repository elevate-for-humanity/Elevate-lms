import Link from 'next/link';
import { Mail, MessageSquareText, PhoneCall, Voicemail } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PHONE_MANAGER_ROLES } from '@/lib/phone/access';

export const dynamic = 'force-dynamic';

export default async function PhoneInboxPage() {
  const auth = await requireRole(PHONE_MANAGER_ROLES);
  const db = await requireAdminClient();
  const tenantId = auth.profile.tenant_id ?? auth.profile.organization_id ?? null;
  let systemQuery = db.from('phone_systems').select('id').limit(1);
  systemQuery = tenantId ? systemQuery.eq('tenant_id', tenantId) : systemQuery.is('tenant_id', null);
  const { data: system } = await systemQuery.maybeSingle();

  const [voicemailResult, callbackResult, smsResult] = system?.id
    ? await Promise.all([
        db.from('voicemails').select('*').eq('phone_system_id', system.id).order('created_at', { ascending: false }).limit(50),
        db.from('phone_callback_tasks').select('*').eq('phone_system_id', system.id).order('created_at', { ascending: false }).limit(50),
        db.from('communication_messages').select('*').eq('channel', 'sms').order('created_at', { ascending: false }).limit(50),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const voicemails = voicemailResult.data ?? [];
  const callbacks = callbackResult.data ?? [];
  const texts = smsResult.data ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-5 bg-slate-50 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-orange-600">Elevate Communications</p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">Phone inbox & messages</h1>
          <p className="mt-1 text-sm text-slate-600">Calls, voicemail, callback interviews, texts, and office email belong in one communications workspace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/phone" className="rounded-xl border bg-white px-4 py-2 text-sm font-black">Phone</Link>
          <Link href="/phone/email" className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-black text-white"><Mail className="mr-2 inline h-4 w-4" />Email</Link>
          <Link href="/operations/sms-logs" className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-black text-white"><MessageSquareText className="mr-2 inline h-4 w-4" />Send text</Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4"><PhoneCall className="h-5 w-5 text-indigo-700" /><p className="mt-2 text-2xl font-black">{callbacks.length}</p><p className="text-sm text-slate-600">Callback items</p></div>
        <div className="rounded-2xl border bg-white p-4"><Voicemail className="h-5 w-5 text-orange-600" /><p className="mt-2 text-2xl font-black">{voicemails.length}</p><p className="text-sm text-slate-600">Voicemails</p></div>
        <div className="rounded-2xl border bg-white p-4"><MessageSquareText className="h-5 w-5 text-cyan-700" /><p className="mt-2 text-2xl font-black">{texts.length}</p><p className="text-sm text-slate-600">Text messages</p></div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-black">Callback inbox</h2>
          <div className="mt-3 space-y-3">{callbacks.length ? callbacks.map((item:any) => <article key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-bold">{item.caller_name || item.phone_number || 'Caller'}</p><p className="mt-1 break-words text-slate-600">{item.summary || item.reason || item.status || 'Callback requested'}{item.transcript ? <details className="mt-2 rounded-lg border border-slate-200 bg-white p-2"><summary className="cursor-pointer font-bold text-indigo-700">Read PARIS interview</summary><p className="mt-2 whitespace-pre-wrap break-words text-slate-700">{item.transcript}</p></details> : null}</p></article>) : <p className="text-sm text-slate-500">No callback items.</p>}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-black">Voicemail</h2>
          <div className="mt-3 space-y-3">{voicemails.length ? voicemails.map((item:any) => <article key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-bold">{item.from_number || item.caller_number || 'Caller'}</p><p className="mt-1 break-words text-slate-600">{item.transcription || item.transcript || 'Voicemail received'}</p></article>) : <p className="text-sm text-slate-500">No voicemail.</p>}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="font-black">Texts</h2>
          <div className="mt-3 space-y-3">{texts.length ? texts.map((item:any) => <article key={item.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p className="font-bold">SMS</p><p className="mt-1 break-words text-slate-600">{item.body}</p></article>) : <p className="text-sm text-slate-500">No text messages.</p>}</div>
        </div>
      </section>
    </main>
  );
}
