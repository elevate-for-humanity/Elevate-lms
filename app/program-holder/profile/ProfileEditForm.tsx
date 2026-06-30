'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, User, MapPin, Phone } from 'lucide-react';

interface Props {
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
}

export default function ProfileEditForm({ profile }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    state: profile.state ?? '',
    zip: profile.zip ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    if (!form.address || !form.city || !form.state || !form.zip) {
      setError('Address, city, state, and ZIP are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/program-holder/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save');
      }
      setSaved(true);
      setTimeout(() => router.push('/program-holder/onboarding'), 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-6 h-6 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 text-sm text-amber-800">
          Your business address is required before payments can be issued.
        </div>

        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {/* Name */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Full Name
            </label>
            <input
              value={form.full_name}
              onChange={set('full_name')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="David Nazaire"
            />
          </div>

          {/* Phone */}
          <div className="px-5 py-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </label>
            <input
              value={form.phone}
              onChange={set('phone')}
              type="tel"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="(215) 214-9355"
            />
          </div>

          {/* Address */}
          <div className="px-5 py-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Business Address <span className="text-red-500">*</span>
            </label>
            <input
              value={form.address}
              onChange={set('address')}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Street address"
            />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <input
                  value={form.city}
                  onChange={set('city')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="City"
                />
              </div>
              <div>
                <input
                  value={form.state}
                  onChange={set('state')}
                  maxLength={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 uppercase"
                  placeholder="State"
                />
              </div>
              <div>
                <input
                  value={form.zip}
                  onChange={set('zip')}
                  maxLength={10}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="ZIP"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {saved ? (
          <div className="mt-6 flex items-center gap-2 bg-brand-green-50 border border-brand-green-200 text-brand-green-700 rounded-xl px-4 py-3 text-sm">
            <span className="w-4 h-4 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" /> Saved — returning to onboarding…
          </div>
        ) : (
          <button
            onClick={save}
            disabled={saving}
            className="mt-6 w-full bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save & Continue'}
          </button>
        )}
      </div>
    </div>
  );
}
