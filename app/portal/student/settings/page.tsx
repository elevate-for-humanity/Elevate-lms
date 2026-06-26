'use client';

import { useState } from 'react';
import { Settings, Bell, Lock, Eye, Globe, Moon, Save, CheckCircle } from 'lucide-react';

export default function StudentSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    classReminders: true,
    gradeAlerts: true,
    weeklyProgress: true,
    darkMode: false,
    language: 'en',
    timezone: 'America/Indiana/Indianapolis',
    profileVisibility: 'classmates',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account preferences</p>
          </div>
        </div>

        {saved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">Settings saved successfully!</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser notifications' },
                { key: 'assignmentReminders', label: 'Assignment Reminders', desc: 'Reminders before due dates' },
                { key: 'classReminders', label: 'Class Reminders', desc: 'Reminders before scheduled classes' },
                { key: 'gradeAlerts', label: 'Grade Alerts', desc: 'When grades are posted' },
                { key: 'weeklyProgress', label: 'Weekly Progress Report', desc: 'Summary of your progress' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={() => setSettings({ ...settings, [item.key]: !settings[item.key as keyof typeof settings] })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
              <select
                value={settings.profileVisibility}
                onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="classmates">Classmates Only</option>
                <option value="instructors">Instructors Only</option>
                <option value="private">Private - Only me</option>
              </select>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Moon className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Use dark theme</p>
              </div>
              <Toggle
                checked={settings.darkMode}
                onChange={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
              />
            </div>
          </div>

          {/* Language & Region */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Language & Region</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="America/Indiana/Indianapolis">Eastern (Indianapolis)</option>
                  <option value="America/Chicago">Central</option>
                  <option value="America/Denver">Mountain</option>
                  <option value="America/Los_Angeles">Pacific</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            </div>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                Change Password
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                Two-Factor Authentication
              </button>
              <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                Active Sessions
              </button>
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
