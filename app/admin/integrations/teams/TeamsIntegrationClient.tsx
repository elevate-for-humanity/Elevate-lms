'use client';

import { useState } from 'react';
import { Users, MessageSquare, CheckCircle, RefreshCw, Settings } from 'lucide-react';

interface TeamChannel {
  id: string;
  name: string;
  type: 'channel' | 'chat';
  members: number;
}

interface Notification {
  id: string;
  type: 'student_enrolled' | 'payment_received' | 'certificate_issued' | 'support_ticket';
  message: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export default function TeamsIntegrationClient() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<TeamChannel[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const connectTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/teams/connect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        } else {
          setConnected(true);
          fetchData();
        }
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
    setLoading(false);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [channelsRes, notifsRes] = await Promise.all([
        fetch('/api/admin/integrations/teams/channels'),
        fetch('/api/admin/integrations/teams/notifications'),
      ]);
      
      if (channelsRes.ok) {
        const data = await channelsRes.json();
        setChannels(data.channels || []);
      }
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(data.notifications || []);
      }
      setConnected(true);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'student_enrolled': return '🎓';
      case 'payment_received': return '💳';
      case 'certificate_issued': return '📜';
      case 'support_ticket': return '🎫';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Microsoft Teams Integration</h1>
        {connected && (
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 inline mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${connected ? 'bg-green-100' : 'bg-slate-100'}`}>
            <MessageSquare className={`w-8 h-8 ${connected ? 'text-green-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h2 className="font-medium text-slate-900">Teams Connection</h2>
            <p className="text-sm text-slate-500">
              {connected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" /> Connected
                </span>
              ) : (
                'Connect Microsoft Teams for notifications'
              )}
            </p>
          </div>
        </div>

        {!connected ? (
          <button
            onClick={connectTeams}
            disabled={loading}
            className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect Microsoft Teams'}
          </button>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" /> Channels ({channels.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {channels.length === 0 ? (
                  <p className="text-slate-500 col-span-full">No channels configured</p>
                ) : (
                  channels.map((channel) => (
                    <div key={channel.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">#{channel.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{channel.type} • {channel.members} members</p>
                      </div>
                      <button className="p-1 text-slate-400 hover:text-brand-blue-600">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-3">Recent Notifications</h3>
              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-slate-500">No notifications sent</p>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <div key={notif.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                        <div>
                          <p className="text-sm text-slate-900">{notif.message}</p>
                          <p className="text-xs text-slate-500">{notif.sentAt}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        notif.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {notif.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
