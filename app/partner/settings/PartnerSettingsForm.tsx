'use client';

import { useState } from 'react';
import { Building2, User, Bell, Save } from 'lucide-react';

interface SettingsData {
  orgId: string | null;
  orgName: string;
  address: string;
  city: string;
  state: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  emailNotifications: boolean;
  weeklyDigest: boolean;
  outcomeAlerts: boolean;
  referralConfirmations: boolean;
}

export default function PartnerSettingsForm({ initialData }: { initialData: SettingsData }) {
  const [settings, setSettings] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/partner/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: settings.orgId,
          name: settings.orgName,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          contact_name: settings.contactName,
          contact_email: settings.contactEmail,
          contact_phone: settings.contactPhone,
          notification_preferences: {
            email: settings.emailNotifications,
            weekly_digest: settings.weeklyDigest,
            outcome_alerts: settings.outcomeAlerts,
            referral_confirmations: settings.referralConfirmations,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg flex items-center gap-3">
          <span className="text-brand-green-600 font-bold">✓</span>
          <span className="text-brand-green-800 font-medium">Settings saved successfully!</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Organization Info */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
            <input type="text" value={settings.orgName}
              onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input type="text" value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" value={settings.city}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" value={settings.state} maxLength={2} placeholder="IN"
                onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Contact */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-brand-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Primary Contact</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
            <input type="text" value={settings.contactName}
              onChange={(e) => setSettings({ ...settings, contactName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-brand-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          {([
            { key: 'emailNotifications'    as const, label: 'Email Notifications',    desc: 'Receive updates via email' },
            { key: 'weeklyDigest'          as const, label: 'Weekly Digest',          desc: 'Summary of referral activity' },
            { key: 'outcomeAlerts'         as const, label: 'Outcome Alerts',         desc: 'When students complete or exit programs' },
            { key: 'referralConfirmations' as const, label: 'Referral Confirmations', desc: 'Confirmation when referrals are received' },
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={settings[item.key]}
                  onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                  className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-600" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
