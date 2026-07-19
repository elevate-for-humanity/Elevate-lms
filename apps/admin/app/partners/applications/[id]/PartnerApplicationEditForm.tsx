'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const STATUSES = ['pending', 'under_review', 'approved', 'rejected', 'waitlisted'];

interface Props {
  applicationId: string;
  currentStatus: string;
  currentNotes: string | null;
}

export default function PartnerApplicationEditForm({ applicationId, currentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const db = createClient();
      const { error } = await db
        .from('partner_applications')
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Edit Application</h2>
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
      <div className="flex justify-end">
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm hover:bg-brand-blue-700 disabled:opacity-50">
          <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
