'use client';

import { useEffect, useState } from 'react';
import {
  Calendar, CheckCircle2, XCircle, RefreshCw, Loader2,
  ExternalLink, Clock, Users, Link2, Webhook, Trash2, Plus,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface CalendlyStatus {
  connected: boolean;
  name?: string;
  email?: string;
  scheduling_url?: string;
  timezone?: string;
  error?: string;
}

interface EventType {
  uri: string;
  name: string;
  active: boolean;
  duration: number;
  scheduling_url: string;
  description_plain?: string;
  kind: string;
}

interface ScheduledEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  invitees_counter: { total: number };
}

interface WebhookSub {
  uri: string;
  callback_url: string;
  state: string;
  events: string[];
  created_at: string;
}

export default function CalendlyClient() {
  const [status, setStatus] = useState<CalendlyStatus | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, et, se, wh] = await Promise.all([
        fetch('/api/admin/integrations/calendly?action=status').then((r) => r.json()),
        fetch('/api/admin/integrations/calendly?action=event_types').then((r) => r.json()),
        fetch('/api/admin/integrations/calendly?action=scheduled_events').then((r) => r.json()),
        fetch('/api/admin/integrations/calendly?action=webhooks').then((r) => r.json()),
      ]);
      setStatus(s);
      setEventTypes(et.event_types ?? []);
      setScheduledEvents(se.events ?? []);
      setWebhooks(wh.webhooks ?? []);
    } catch {
      setStatus({ connected: false, error: 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }

  async function createWebhook() {
    setWorking(true);
    setActionMsg('');
    setActionErr('');
    try {
      const res = await fetch('/api/admin/integrations/calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_webhook' }),
      });
      const d = await res.json();
      if (!res.ok) { setActionErr(d.error ?? 'Failed'); return; }
      setActionMsg('Webhook created successfully');
      loadAll();
    } catch { setActionErr('Network error'); }
    finally { setWorking(false); }
  }

  async function deleteWebhook(uri: string) {
    const uuid = uri.split('/').pop();
    if (!uuid || !confirm('Delete this webhook?')) return;
    setWorking(true);
    setActionMsg('');
    setActionErr('');
    try {
      const res = await fetch('/api/admin/integrations/calendly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_webhook', webhookUuid: uuid }),
      });
      const d = await res.json();
      if (!res.ok) { setActionErr(d.error ?? 'Failed'); return; }
      setActionMsg('Webhook deleted');
      loadAll();
    } catch { setActionErr('Network error'); }
    finally { setWorking(false); }
  }

  const scheduled = scheduledEvents.filter((e) => e.status === 'active').length;
  const canceled = scheduledEvents.filter((e) => e.status === 'canceled').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Integrations', href: '/admin/integrations' },
        { label: 'Calendly' },
      ]} />

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Calendly</h1>
            <p className="text-slate-500 text-sm">Scheduling and booking management</p>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading}
          className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Connection status */}
      <div className={`mt-6 rounded-2xl border p-5 ${status?.connected ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          {loading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : status?.connected ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <div>
            <p className="font-semibold text-slate-800">
              {status?.connected ? 'Connected' : 'Not connected'}
            </p>
            {status?.connected && (
              <p className="text-sm text-slate-500">
                {status.name} · {status.email} · {status.timezone}
              </p>
            )}
            {status?.error && <p className="text-sm text-red-600">{status.error}</p>}
          </div>
          {status?.scheduling_url && (
            <a href={status.scheduling_url} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              Scheduling page <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Event Types</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{eventTypes.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Scheduled (30d)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{scheduled}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Canceled (30d)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{canceled}</p>
        </div>
      </div>

      {/* Event Types */}
      {eventTypes.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Event Types</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {eventTypes.map((et) => (
              <div key={et.uri} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{et.name}</p>
                  <p className="text-xs text-slate-400">{et.duration} min · {et.kind}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${et.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {et.active ? 'Active' : 'Inactive'}
                  </span>
                  <a href={et.scheduling_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Events */}
      {scheduledEvents.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Recent Events (30 days)</h2>
            <span className="ml-auto text-xs text-slate-400">{scheduledEvents.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Event', 'Start', 'Invitees', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {scheduledEvents.slice(0, 20).map((ev) => (
                  <tr key={ev.uri} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">{ev.name}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(ev.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{ev.invitees_counter?.total ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Webhooks */}
      <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Webhooks</h2>
          </div>
          <button onClick={createWebhook} disabled={working}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
            {working ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Register Webhook
          </button>
        </div>

        {actionMsg && (
          <div className="mx-5 mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{actionMsg}</div>
        )}
        {actionErr && (
          <div className="mx-5 mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{actionErr}</div>
        )}

        {webhooks.length === 0 ? (
          <div className="px-5 py-6 text-sm text-slate-400 text-center">
            No webhooks registered. Click <strong>Register Webhook</strong> to add one.
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {webhooks.map((wh) => (
              <div key={wh.uri} className="flex items-start justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate-600 truncate">{wh.callback_url}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {wh.events.join(', ')} · {wh.state} · created {new Date(wh.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => deleteWebhook(wh.uri)} disabled={working}
                  className="text-slate-300 hover:text-red-500 transition disabled:opacity-40 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DB bookings link */}
      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-1">Webhook-received bookings</p>
        <p className="text-xs text-slate-500">
          Bookings received via webhook are stored in the <code className="bg-white border border-slate-200 px-1 rounded">calendly_bookings</code> table.
          Webhook URL: <code className="bg-white border border-slate-200 px-1 rounded break-all">
            {typeof window !== 'undefined' ? window.location.origin.replace('admin.', 'www.') : PLATFORM_DEFAULTS.siteUrl}/api/chatbot/calendly-webhook
          </code>
        </p>
      </div>
    </div>
  );
}
