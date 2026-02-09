'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings, Building2, User, Bell, Shield, Save, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function PartnerSettingsPage() {
  const [saved, setSaved] = useState(false);
  // Settings loaded from user profile/organization
  const [settings, setSettings] = useState({
    orgName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    emailNotifications: true,
    weeklyDigest: true,
    outcomeAlerts: true,
    referralConfirmations: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Settings' }]} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Partner Settings</h1>
            <p className="text-gray-600">Manage your organization profile and preferences</p>
          </div>
          <Link href="/partner" className="text-blue-600 hover:text-blue-700">← Back to Portal</Link>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Organization Info */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Organization Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={settings.orgName}
                  onChange={(e) => setSettings({ ...settings, orgName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Primary Contact */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Primary Contact</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={settings.contactName}
                  onChange={(e) => setSettings({ ...settings, contactName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={settings.contactPhone}
                  onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of referral activity' },
                { key: 'outcomeAlerts', label: 'Outcome Alerts', desc: 'When students complete or exit programs' },
                { key: 'referralConfirmations', label: 'Referral Confirmations', desc: 'Confirmation when referrals are received' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[item.key as keyof typeof settings] as boolean}
                      onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Save className="w-4 h-4" /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
