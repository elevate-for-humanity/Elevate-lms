'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Facebook, Instagram, Youtube, Linkedin,
  CheckCircle2, XCircle, Loader2, RefreshCw, Unlink,
  ExternalLink, AlertTriangle, Send,
} from 'lucide-react';

interface PlatformStatus {
  platform: string;
  connected: boolean;
  profile_data?: Record<string, unknown>;
  expires_at?: string;
  expired?: boolean;
}

const PLATFORMS = [
  {
    id: 'facebook',
    label: 'Facebook',
    Icon: Facebook,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    authorizeUrl: '/api/auth/facebook/authorize',
    connectBg: 'bg-blue-600 hover:bg-blue-700',
    capabilities: ['Posts', 'Photos', 'Videos', 'Reels', 'Stories'],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    Icon: Instagram,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    authorizeUrl: '/api/auth/instagram/authorize',
    connectBg: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    capabilities: ['Posts', 'Reels', 'Stories', 'Carousels'],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    Icon: Youtube,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    authorizeUrl: '/api/auth/youtube/authorize',
    connectBg: 'bg-red-600 hover:bg-red-700',
    capabilities: ['Videos', 'Shorts', 'Community Posts'],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    Icon: Linkedin,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    authorizeUrl: '/api/auth/linkedin/authorize',
    connectBg: 'bg-blue-700 hover:bg-blue-800',
    capabilities: ['Posts', 'Articles', 'Videos'],
  },
];

export default function SocialMediaSettingsClient() {
  const [statuses, setStatuses] = useState<Record<string, PlatformStatus>>({});
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social-media/status');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, PlatformStatus> = {};
        for (const s of data.statuses ?? []) map[s.platform] = s;
        setStatuses(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatuses();
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const error = params.get('error');
    if (success) {
      const platform = success.replace('_connected', '');
      showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully`);
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (error) {
      showToast(`Connection failed: ${error.replace(/_/g, ' ')}`, 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [loadStatuses]);

  const disconnect = async (platform: string) => {
    setDisconnecting(platform);
    try {
      const res = await fetch('/api/admin/social-media/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        showToast(`${platform} disconnected`);
        await loadStatuses();
      } else {
        showToast('Failed to disconnect', 'error');
      }
    } finally {
      setDisconnecting(null);
    }
  };

  const connectedCount = Object.values(statuses).filter(s => s.connected).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Social Media Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your accounts to publish posts, reels, and blogs directly from the admin dashboard.
        </p>
        {!loading && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              connectedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connectedCount > 0 ? 'bg-green-500' : 'bg-gray-400'}`} />
              {connectedCount} of {PLATFORMS.length} connected
            </span>
            <button onClick={loadStatuses} className="text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {PLATFORMS.map(({ id, label, Icon, color, bg, border, authorizeUrl, connectBg, capabilities }) => {
          const status = statuses[id];
          const connected = status?.connected ?? false;
          const expired = status?.expired ?? false;
          const profileName =
            (status?.profile_data as any)?.name ||
            (status?.profile_data as any)?.username ||
            (status?.profile_data as any)?.data?.name ||
            null;

          return (
            <div key={id} className={`flex items-center justify-between p-4 rounded-xl border bg-white ${connected ? border : 'border-gray-200'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${connected ? bg : 'bg-gray-100'} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${connected ? color : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{label}</span>
                    {connected && !expired && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Connected
                      </span>
                    )}
                    {connected && expired && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <AlertTriangle className="w-3 h-3" /> Token expired
                      </span>
                    )}
                  </div>
                  {connected && profileName && (
                    <p className="text-xs text-gray-500 mt-0.5">{profileName}</p>
                  )}
                  {!connected && (
                    <p className="text-xs text-gray-400 mt-0.5">{capabilities.join(' · ')}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : connected && !expired ? (
                  <>
                    <a
                      href={`/admin/social-media/campaigns/new?platform=${id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Send className="w-3 h-3" /> Post
                    </a>
                    <button
                      onClick={() => disconnect(id)}
                      disabled={disconnecting === id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {disconnecting === id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                      Disconnect
                    </button>
                  </>
                ) : (
                  <a
                    href={authorizeUrl}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors ${connectBg}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Connect
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
