'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  applicationId: string;
  currentStatus: string;
  currentNotes: string | null;
}

const STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'];

export default function BarberShopApplicationActions({ applicationId, currentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const db = await import('@/lib/supabase/client').then(m => m.createClient());
      const { error } = await db
        .from('barbershop_partner_applications')
        .update({ status, notes: notes || null })
        .eq('id', applicationId);
      if (error) throw new Error(error.message);
      toast.success('Application updated');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!confirm('Approve this barbershop application?')) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/barber-shop-applications/${applicationId}/approve`, { method: 'POST' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      toast.success('Application approved');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setApproving(false);
    }
  };

  const reject = async () => {
    const reason = prompt('Rejection reason (required):');
    if (!reason?.trim()) return;
    setRejecting(true);
    try {
      const res = await fetch(`/api/admin/barber-shop-applications/${applicationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      toast.success('Application rejected');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Edit &amp; Actions</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          placeholder="Internal notes…"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500" />
      </div>

      <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm hover:bg-brand-blue-700 disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
        </button>
        {currentStatus !== 'approved' && (
          <button onClick={approve} disabled={approving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
            <CheckCircle className="w-4 h-4" />{approving ? 'Approving…' : 'Approve'}
          </button>
        )}
        {currentStatus !== 'rejected' && (
          <button onClick={reject} disabled={rejecting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
            <XCircle className="w-4 h-4" />{rejecting ? 'Rejecting…' : 'Reject'}
          </button>
        )}
      </div>
    </div>
  );
}
