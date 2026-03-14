'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

export default function InviteStaff({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('instructor');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/provider/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, email, role, fullName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Invite failed'); return; }
      setDone(true);
      setEmail(''); setFullName(''); setRole('instructor');
      setTimeout(() => { setDone(false); router.refresh(); }, 2000);
    } catch { setError('Network error.'); }
    finally { setSubmitting(false); }
  }

  return (
    <form onSubmit={invite} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email <span className="text-red-500">*</span></label>
          <input
            value={email} onChange={e => setEmail(e.target.value)}
            type="email" placeholder="jane@example.org"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
          <input
            value={fullName} onChange={e => setFullName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
          <select
            value={role} onChange={e => setRole(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 bg-white"
          >
            <option value="instructor">Instructor</option>
            <option value="staff">Staff</option>
            <option value="provider_admin">Admin</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && (
        <div className="flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4" /> Invite sent.
        </div>
      )}

      <button
        type="submit" disabled={submitting}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:opacity-50"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Send Invite
      </button>
    </form>
  );
}
