'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import { Save, Loader2 } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface ProfileFormProps {
  profile: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    bio?: string;
  } | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setMessage(null);

    // Use /api/profile/update so auditMutation fires on every save
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          first_name: formData.get('first_name'),
          last_name: formData.get('last_name'),
          phone: formData.get('phone'),
          bio: formData.get('bio'),
        },
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error ?? 'Profile update failed' });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }

    setSaving(false);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-brand-green-50 text-brand-green-800 border border-brand-green-200' : 'bg-brand-red-50 text-brand-red-800 border border-brand-red-200'}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-slate-900 mb-2">
            First Name
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            defaultValue={profile?.first_name || ''}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-slate-900 mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            defaultValue={profile?.last_name || ''}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-slate-900 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          defaultValue={profile?.phone || ''}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          placeholder={PLATFORM_DEFAULTS.supportPhone}
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-slate-900 mb-2">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile?.bio || ''}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
          placeholder="Tell us about yourself..."
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white font-medium rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Save Changes
          </>
        )}
      </button>
    </form>
  );
}
