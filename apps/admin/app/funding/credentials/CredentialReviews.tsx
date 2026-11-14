'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
type ReviewRow = { id: string; name: string; original_filename: string | null; verification_status: string; credential_earned_date: string | null; verified_at: string | null; rejection_reason: string | null };
export function CredentialReviews({ rows }: { rows: ReviewRow[] }) {
  const [filter, setFilter] = useState('pending');
  const visible = rows.filter(row => filter === 'all' || row.verification_status === filter);
  return <div className="space-y-4"><label>Review status<select value={filter} onChange={e => setFilter(e.target.value)} className="ml-3 rounded-lg border p-2"><option value="pending">Submitted for review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All uploads</option></select></label><p role="status">{visible.length} uploads</p>{visible.map(row => <ReviewCard key={row.id} row={row} />)}{!visible.length && <p>No uploads in this review status.</p>}</div>;
}
function ReviewCard({ row }: { row: ReviewRow }) {
  const router = useRouter();
  const [earnedDate, setEarnedDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function review(decision: 'approved' | 'rejected') {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/credential-uploads/${row.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, earnedDate, reason }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setMessage('Review saved with audit history.'); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Review failed.'); }
    finally { setBusy(false); }
  }
  return <article className="space-y-3 rounded-xl border bg-white p-4"><h2 className="text-xl font-bold">{row.name}</h2><p className="break-words">{row.original_filename} · {row.verification_status}</p><a className="font-bold text-blue-700 underline" target="_blank" rel="noopener noreferrer" href={`/api/admin/credential-uploads/${row.id}`}>Preview protected document</a>{row.credential_earned_date && <p>Credential earned: {row.credential_earned_date}</p>}{row.verified_at && <p>Reviewed: {row.verified_at.slice(0, 10)}</p>}{row.rejection_reason && <p>Rejection reason: {row.rejection_reason}</p>}{row.verification_status === 'pending' && <div className="space-y-3"><label className="block">Documented earned date<input type="date" value={earnedDate} onChange={e => setEarnedDate(e.target.value)} className="ml-2 rounded-lg border p-2" /></label><label className="block">Reason if rejected<textarea maxLength={4000} value={reason} onChange={e => setReason(e.target.value)} className="block w-full rounded-lg border p-2" /></label><div className="flex flex-wrap gap-3"><button disabled={busy || !earnedDate} onClick={() => review('approved')} className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-50">Approve evidence</button><button disabled={busy || !reason.trim()} onClick={() => review('rejected')} className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white disabled:opacity-50">Reject with reason</button></div></div>}<p role="status" className="text-sm">{message}</p></article>;
}
