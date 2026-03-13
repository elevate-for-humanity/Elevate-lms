'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Settings {
  site_name: string;
  support_email: string;
  email_notifications: string;
  system_alerts: string;
}

const DEFAULTS: Settings = {
  site_name: 'Elevate For Humanity',
  support_email: 'info@elevateforhumanity.org',
  email_notifications: 'true',
  system_alerts: 'true',
};

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.settings) setSettings({ ...DEFAULTS, ...d.settings });
      })
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Save failed');
      }
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading settings...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Site Name</label>
        <input
          type="text"
          value={settings.site_name}
          onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">Support Email</label>
        <input
          type="email"
          value={settings.support_email}
          onChange={e => setSettings(s => ({ ...s, support_email: e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          required
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Notifications</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.email_notifications === 'true'}
            onChange={e => setSettings(s => ({ ...s, email_notifications: e.target.checked ? 'true' : 'false' }))}
            className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
          />
          <span className="text-sm text-slate-700">Email notifications</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.system_alerts === 'true'}
            onChange={e => setSettings(s => ({ ...s, system_alerts: e.target.checked ? 'true' : 'false' }))}
            className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
          />
          <span className="text-sm text-slate-700">System alerts</span>
        </label>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>

        {status === 'saved' && (
          <span className="flex items-center gap-1.5 text-brand-green-600 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Saved
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-brand-red-600 text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </span>
        )}
      </div>
    </form>
  );
}
