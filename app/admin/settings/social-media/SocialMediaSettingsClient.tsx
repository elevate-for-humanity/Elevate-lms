'use client';

import { useState } from 'react';
import { Share2, Save, Loader2, Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';

interface SocialMediaSettings {
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  share_enabled: boolean;
  auto_post: boolean;
}

export default function SocialMediaSettingsClient() {
  const [settings, setSettings] = useState<SocialMediaSettings>({
    twitter: '',
    facebook: '',
    linkedin: '',
    instagram: '',
    share_enabled: true,
    auto_post: false,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/social-media');
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
      const res = await fetch('/api/admin/settings/social-media', {
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
        <h1 className="text-2xl font-bold flex items-center gap-2"><Share2 className="w-6 h-6" /> Social Media Settings</h1>
        <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>
      <div className="bg-white p-6 rounded-lg border space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Twitter className="w-5 h-5 text-[#1DA1F2]" /> Twitter/X
            </label>
            <input
              type="url"
              value={settings.twitter || ''}
              onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
              placeholder="https://twitter.com/..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Facebook className="w-5 h-5 text-[#4267B2]" /> Facebook
            </label>
            <input
              type="url"
              value={settings.facebook || ''}
              onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
              placeholder="https://facebook.com/..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Linkedin className="w-5 h-5 text-[#0077B5]" /> LinkedIn
            </label>
            <input
              type="url"
              value={settings.linkedin || ''}
              onChange={(e) => setSettings({ ...settings, linkedin: e.target.value })}
              placeholder="https://linkedin.com/..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Instagram className="w-5 h-5 text-[#E4405F]" /> Instagram
            </label>
            <input
              type="url"
              value={settings.instagram || ''}
              onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
              placeholder="https://instagram.com/..."
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="share"
              checked={settings.share_enabled}
              onChange={(e) => setSettings({ ...settings, share_enabled: e.target.checked })}
              className="w-5 h-5"
            />
            <label htmlFor="share" className="text-sm font-medium text-gray-700">Enable Social Sharing Buttons</label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto"
              checked={settings.auto_post}
              onChange={(e) => setSettings({ ...settings, auto_post: e.target.checked })}
              className="w-5 h-5"
            />
            <label htmlFor="auto" className="text-sm font-medium text-gray-700">Auto-post to social media on new content</label>
          </div>
        </div>
      </div>
    </div>
  );
}
