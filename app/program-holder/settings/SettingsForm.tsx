'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  organization: string;
  email: string;
  notifyEnrollments: boolean;
  notifyWeeklyReports: boolean;
}

export default function ProgramHolderSettingsForm({
  organization,
  email,
  notifyEnrollments,
  notifyWeeklyReports,
}: Props) {
  const [org, setOrg] = useState(organization);
  const [emailVal, setEmailVal] = useState(email);
  const [notifyEnroll, setNotifyEnroll] = useState(notifyEnrollments);
  const [notifyReports, setNotifyReports] = useState(notifyWeeklyReports);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch('/api/program-holder/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: org,
          email: emailVal,
          notify_enrollments: notifyEnroll,
          notify_weekly_reports: notifyReports,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/program-holder" className="hover:text-primary">
                  Program Holder
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Settings</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Program Settings</h1>
          <p className="text-slate-700 mt-2">Manage your account and program preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Organization Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Organization Name
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-900">
                  Email notifications for new enrollments
                </span>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={notifyEnroll}
                  onChange={(e) => setNotifyEnroll(e.target.checked)}
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-900">Weekly progress reports</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={notifyReports}
                  onChange={(e) => setNotifyReports(e.target.checked)}
                />
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
          {saved && (
            <p className="text-sm text-brand-green-700 bg-brand-green-50 border border-brand-green-200 rounded-lg px-4 py-3">
              Settings saved successfully.
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
