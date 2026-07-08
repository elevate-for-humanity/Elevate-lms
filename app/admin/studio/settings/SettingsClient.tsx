'use client';

import { useState } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';

interface StudioSettings {
  default_template: string;
  auto_save: boolean;
  auto_save_interval: number;
  max_revisions: number;
  enable_ai_suggestions: boolean;
  api_key?: string;
}

export default function SettingsClient() {
  const [settings, setSettings] = useState<StudioSettings>({
    default_template: 'default',
    auto_save: true,
    auto_save_interval: 30,
    max_revisions: 10,
    enable_ai_suggestions: false,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/studio/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" /> Studio Settings</h1>
        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg border space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Editor Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Template</label>
              <select
                value={settings.default_template}
                onChange={(e) => setSettings({ ...settings, default_template: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="default">Default</option>
                <option value="landing">Landing Page</option>
                <option value="blog">Blog Post</option>
                <option value="blank">Blank</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autosave"
                checked={settings.auto_save}
                onChange={(e) => setSettings({ ...settings, auto_save: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="autosave" className="text-sm font-medium text-gray-700">Auto-save</label>
            </div>
            {settings.auto_save && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auto-save Interval (seconds)</label>
                <input
                  type="number"
                  value={settings.auto_save_interval}
                  onChange={(e) => setSettings({ ...settings, auto_save_interval: parseInt(e.target.value) })}
                  min={10}
                  max={300}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Revisions</label>
              <input
                type="number"
                value={settings.max_revisions}
                onChange={(e) => setSettings({ ...settings, max_revisions: parseInt(e.target.value) })}
                min={1}
                max={50}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">AI Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ai"
                checked={settings.enable_ai_suggestions}
                onChange={(e) => setSettings({ ...settings, enable_ai_suggestions: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="ai" className="text-sm font-medium text-gray-700">Enable AI Suggestions</label>
            </div>
            {settings.enable_ai_suggestions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={settings.api_key || ''}
                  onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                  placeholder="Enter API key..."
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
