'use client';

import { useState } from 'react';
import { CheckCircle, Info, Loader2, XCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const STAT_LABELS: Record<string, { label: string; description: string; placeholder: string }> = {
  stat_job_placement_rate:   { label: 'Job Placement Rate (%)',   description: 'Shown as "94%" on homepage stats strip', placeholder: '94' },
  stat_programs_offered:     { label: 'Programs Offered',         description: 'Number of active credential programs',   placeholder: '30' },
  stat_credentials_issued:   { label: 'Credentials Issued',       description: 'Use "—" until verified',                 placeholder: '—' },
  stat_employer_partners:    { label: 'Employer Partners',        description: 'Use "—" until verified',                 placeholder: '—' },
  stat_funding_secured_usd:  { label: 'Funding Secured',          description: 'Display string, e.g. "$2.4M"',           placeholder: '—' },
  stat_students_display:     { label: 'Students Display',         description: 'Use "Many" until verified count exists', placeholder: 'Many' },
};

type Toast = { type: 'success' | 'error'; message: string };

export default function SiteStatsClient({
  current,
  statKeys,
}: {
  current: Record<string, string>;
  statKeys: readonly string[];
}) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const k of statKeys) init[k] = current[k] ?? '';
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<Toast | null>(null);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert each changed key via platform_settings API
      const res = await fetch('/api/admin/platform-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      if (res.ok) {
        showToast('success', 'Stats updated — changes go live on next page revalidation (≤60s)');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('error', err.error ?? 'Failed to save stats');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Settings', href: '/admin/settings' },
          { label: 'Site Stats' },
        ]} />

        <div>
          <h1 className="text-2xl font-bold text-white">Site Statistics</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Override the homepage stats strip without a deploy. Changes take effect within 60 seconds.
          </p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-950/30 border border-blue-800 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm">
            Values are stored in <code className="text-blue-200">platform_settings</code> and override the hardcoded fallbacks in <code className="text-blue-200">lib/site-stats.ts</code>.
            Leave a field blank to use the hardcoded default.
          </p>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
            toast.type === 'success'
              ? 'bg-green-950/40 border-green-800 text-green-300'
              : 'bg-red-950/40 border-red-800 text-red-300'
          }`}>
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
              : <XCircle className="w-4 h-4 flex-shrink-0" />}
            {toast.message}
          </div>
        )}

        {/* Stat fields */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
          {statKeys.map(key => {
            const meta = STAT_LABELS[key] ?? { label: key, description: '', placeholder: '' };
            return (
              <div key={key} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-white text-sm font-medium mb-0.5">{meta.label}</label>
                  <p className="text-slate-500 text-xs mb-2">{meta.description}</p>
                  <input
                    value={values[key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                    placeholder={meta.placeholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue-500"
                  />
                </div>
                {current[key] && current[key] !== values[key] && (
                  <div className="flex-shrink-0 mt-7">
                    <span className="text-xs text-amber-400">unsaved</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Save Stats
          </button>
          <p className="text-slate-600 text-xs">super_admin only</p>
        </div>
      </div>
    </div>
  );
}
