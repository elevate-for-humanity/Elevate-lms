'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Edit2, X, Save } from 'lucide-react';

const STATUSES = [
  'pending',
  'submitted',
  'in_review',
  'under_review',
  'pending_admin_review',
  'pending_funding',
  'approved',
  'rejected',
  'enrolled',
  'waitlisted',
  'ready_to_enroll',
  'pending_workone',
];

interface Props {
  applicationId: string;
  currentStatus: string;
  currentNotes: string | null;
}

export default function EditApplicationForm({ applicationId, currentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? '');

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, review_notes: notes || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? 'Failed to save');
      }
      toast.success('Application updated');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
      >
        <Edit2 className="w-4 h-4" /> Edit Application
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Edit Application</h3>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Review Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Internal notes about this application…"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm hover:bg-brand-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
