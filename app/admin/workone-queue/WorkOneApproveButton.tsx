'use client';

import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  applicationId: string;
  studentName: string;
  hasApproval: boolean;
}

export default function WorkOneApproveButton({ applicationId, studentName, hasApproval }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function confirm() {
    setSaving(true);
    setError('');
    const res = await fetch(`/api/admin/applications/${applicationId}/confirm-workone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workone_approval_ref: ref || null }),
    });
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Failed to update');
    }
    setSaving(false);
  }

  if (hasApproval) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
        <CheckCircle className="w-3.5 h-3.5" /> WorkOne confirmed
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition"
      >
        <CheckCircle className="w-3.5 h-3.5" /> Confirm WorkOne approval
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 mb-1">Confirm WorkOne Approval</h3>
            <p className="text-sm text-slate-500 mb-4">
              Confirming that <strong>{studentName}</strong> has received WorkOne eligibility
              approval. This will unblock their application for final approval.
            </p>

            <label className="block text-sm font-medium text-slate-700 mb-1">
              WorkOne authorization code or case number <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={ref}
              onChange={e => setRef(e.target.value)}
              placeholder="e.g. WO-2025-XXXXX"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={confirm}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Confirm approval'}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
