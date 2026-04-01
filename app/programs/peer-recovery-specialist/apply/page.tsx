'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PeerRecoveryApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    city: '', zip: '', contactPreference: 'phone',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          zip: form.zip,
          program: 'peer-recovery-specialist',
          programSlug: 'peer-recovery-specialist',
          programName: 'Peer Recovery Specialist',
          contactPreference: form.contactPreference,
          source: 'program-page',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed.'); return; }
      router.push(`/programs/peer-recovery-specialist/apply/success${data.id ? `?id=${data.id}` : ''}`);
    } catch {
      setError('Unexpected error. Please call 317-314-3757.');
    } finally {
      setLoading(false);
    }
  }

  const field = 'w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/programs/peer-recovery-specialist" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8">
          ← Back to program
        </Link>
        <h1 className="text-3xl font-bold">Apply — Peer Recovery Specialist</h1>
        <p className="mt-2 text-slate-600">WIOA and Job Ready Indy funding available for eligible Indiana residents.</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">First name *</label>
              <input required className={field} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Last name *</label>
              <input required className={field} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email *</label>
            <input required type="email" className={field} value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone *</label>
            <input required type="tel" className={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">City *</label>
              <input required className={field} value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">ZIP *</label>
              <input required className={field} value={form.zip} onChange={(e) => set('zip', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Preferred contact</label>
            <select className={field} value={form.contactPreference} onChange={(e) => set('contactPreference', e.target.value)}>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="text">Text</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
          <p className="text-center text-xs text-slate-500">
            By submitting you agree to our{' '}
            <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </main>
  );
}
