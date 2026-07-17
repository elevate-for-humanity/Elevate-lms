'use client';

import { useState } from 'react';
import { Webhook, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

interface WebhookEvent {
  id: string;
  webhook_id: string;
  webhook_name: string;
  url: string;
  event_type: string;
  status: 'success' | 'failed' | 'pending' | 'retrying';
  response_code?: number;
  response_time_ms?: number;
  error?: string;
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'paused' | 'disabled';
  success_rate: number;
  last_triggered?: string;
}

export default function WebhookHealthDashboard() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [whRes, evRes] = await Promise.all([
        fetch('/api/admin/system/webhooks'),
        fetch('/api/admin/system/webhooks/events'),
      ]);
      if (whRes.ok) {
        const data = await whRes.json();
        setWebhooks(data.webhooks || []);
      }
      if (evRes.ok) {
        const data = await evRes.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'retrying': return <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Webhook className="w-6 h-6" /> Webhook Health</h1>
        <button onClick={fetchData} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Webhooks</p>
          <p className="text-2xl font-bold">{webhooks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Success Rate</p>
          <p className="text-2xl font-bold text-green-600">
            {webhooks.length ? Math.round(webhooks.reduce((acc, w) => acc + w.success_rate, 0) / webhooks.length) : 0}%
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Events (24h)</p>
          <p className="text-2xl font-bold">{events.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{events.filter(e => e.status === 'failed').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Recent Events</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Webhook</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Response</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {events.slice(0, 20).map(event => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{getStatusIcon(event.status)}</td>
                <td className="px-4 py-3 text-sm">{event.webhook_name}</td>
                <td className="px-4 py-3 text-gray-600 font-mono text-sm">{event.event_type}</td>
                <td className="px-4 py-3">
                  {event.response_code && (
                    <span className={`font-mono text-sm ${event.response_code >= 200 && event.response_code < 300 ? 'text-green-600' : 'text-red-600'}`}>
                      {event.response_code}
                    </span>
                  )}
                  {event.response_time_ms && <span className="text-gray-500 ml-2">{event.response_time_ms}ms</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{event.error ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{event.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
