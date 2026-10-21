'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { VoucherRosterRow } from '@/lib/admin/voucher-roster';
export function VoucherRoster({ rows }: { rows: VoucherRosterRow[] }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const visible = rows.filter(r => `${r.name} ${r.voucher || ''} ${r.source} ${r.holder} ${r.program}`.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || status === 'tasks' && r.alerts.length > 0 || r.fundingStatus === status));
  const date = (value: string | null | undefined) => value ? value.slice(0, 10) : 'Undocumented';
  return <main className="mx-auto w-full min-w-0 max-w-screen-2xl space-y-5 px-4 py-6">
    <Link href="/funding" className="font-bold text-blue-700">← Funding</Link>
    <h1 className="text-3xl font-black">Student funding reconciliation</h1>
    <p>ITA vouchers and funding without voucher numbers, including WRG. Recorded paid amounts require settlement evidence; submission does not confirm payment. Provider references require provider confirmation.</p>
    <div className="flex flex-wrap gap-4"><label className="min-w-0 flex-1">Search students, vouchers, programs or holders<input className="block w-full rounded-lg border p-3" value={search} onChange={e => setSearch(e.target.value)} /></label><label>Filter<select className="block rounded-lg border p-3" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All records</option><option value="tasks">Outstanding tasks</option>{[...new Set(rows.map(r => r.fundingStatus))].map(s => <option key={s} value={s}>{s}</option>)}</select></label></div>
    <p role="status">Showing {visible.length} of {rows.length} funding records</p>
    <div className="space-y-4">{visible.map(r => <article key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">{r.name}</h2><p>{r.program} · {r.enrollmentStatus}</p></div>{r.userId ? <Link className="rounded-lg border px-4 py-2 font-bold text-blue-700" href={`/students/${r.userId}`}>Manage student</Link> : <p className="font-bold text-amber-800">Login not linked</p>}</div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div><dt className="font-bold">Funding</dt><dd>{r.source} · {r.fundingStatus}</dd><dd>{r.voucher ? `Voucher ${r.voucher}` : 'No voucher number documented'}</dd><dd>Authorization: {date(r.authorization)}</dd><dd>Recorded paid: {r.recordedPaid == null ? 'Unverified' : new Intl.NumberFormat('en-US', {style:'currency',currency:'USD'}).format(r.recordedPaid)}; settlement unverified</dd></div>
        <div><dt className="font-bold">Training dates</dt><dd>Start: {date(r.start)}</dd><dd>Expected: {date(r.expected)}</dd><dd>Actual: {date(r.actual)}</dd></div>
        <div><dt className="font-bold">Program Holder</dt><dd>{r.holder}</dd><dt className="mt-2 font-bold">Certification</dt><dd>{r.credentialStatus}</dd><Link className="font-bold text-blue-700 underline" href="/funding/credentials">Review credential uploads</Link></div>
        <div><dt className="font-bold">Career readiness</dt><dd>Resume: {r.resume ? 'Saved' : 'Missing'}</dd><dd>Career profile: {r.career ? 'Started' : 'Not started'}</dd><dd>Provider records: {r.providers.length ? r.providers.map(p => `${p.name}: ${p.status}`).join('; ') : 'None'}</dd></div>
      </dl>
      {r.alerts.length > 0 && <ul className="mt-3 list-inside list-disc rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{r.alerts.map(a => <li key={a}>{a}</li>)}</ul>}
      <details className="mt-3"><summary className="cursor-pointer font-bold">Supporting source evidence</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.evidence}</p></details>
    </article>)}</div>
    {visible.length === 0 && <p>No matching records.</p>}
  </main>;
}
