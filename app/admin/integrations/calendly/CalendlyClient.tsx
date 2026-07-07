'use client';

import { useState } from 'react';
import { Calendar, Link as LinkIcon, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface CalendlyEvent {
  id: string;
  student_name: string;
  event_type: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  meeting_link?: string;
}

export default function CalendlyClient() {
  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const connectCalendly = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/calendly/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        setConnected(true);
        fetchEvents();
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
    setLoading(false);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/calendly/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"><Calendar className="w-3 h-3" /> Scheduled</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Calendly Integration</h1>
        {connected && (
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Refresh
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${connected ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Calendar className={`w-6 h-6 ${connected ? 'text-green-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <h2 className="font-medium text-slate-900">Calendly Connection</h2>
            <p className="text-sm text-slate-500">
              {connected ? 'Connected and syncing events' : 'Connect your Calendly account'}
            </p>
          </div>
        </div>

        {!connected ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Calendly API key"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <button
              onClick={connectCalendly}
              disabled={loading || !apiKey}
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Calendly'}
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Calendly connected successfully</span>
              </div>
            </div>

            <h3 className="font-medium text-slate-900 mb-3">Upcoming Events</h3>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No upcoming events</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{event.student_name}</p>
                      <p className="text-sm text-slate-500">{event.event_type} - {event.scheduled_time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(event.status)}
                      {event.meeting_link && (
                        <a
                          href={event.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-brand-blue-600 hover:bg-brand-blue-50 rounded"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
