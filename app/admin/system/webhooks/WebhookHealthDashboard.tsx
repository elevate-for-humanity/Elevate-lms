'use client';

import { useState, useEffect, useCallback } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  SkipForward,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Clock,
  Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  total: number;
  processed: number;
  failed: number;
  errored: number;
  skipped: number;
}

interface ProviderHealth {
  provider: string;
  last24h: number;
  baselineDailyAvg: number;
  ratio: number;
  healthy: boolean;
  statusBreakdown: Record<string, number>;
  lastEventAt: string | null;
}

interface HealthData {
  healthy: boolean;
  checkedAt: string;
  summary: Summary;
  providers: ProviderHealth[];
  alerts: string[];
}

interface WebhookEvent {
  id: string;
  provider: string;
  event_id: string | null;
  event_type: string | null;
  status: string;
  payment_reference: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  received_at: string;
}

interface EventsData {
  events: WebhookEvent[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

interface Filters {
  provider: string;
  status: string;
  event_type: string;
  from: string;
  to: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVIDERS = ['', 'stripe', 'sezzle', 'affirm', 'jotform', 'calendly', 'resend'];
const STATUSES = ['', 'received', 'validated', 'processing', 'processed', 'failed', 'errored', 'skipped'];

const STATUS_STYLES: Record<string, string> = {
  processed: 'bg-green-100 text-green-800',
  received: 'bg-brand-blue-100 text-brand-blue-800',
  validated: 'bg-brand-blue-100 text-brand-blue-700',
  processing: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  errored: 'bg-red-100 text-red-900',
  skipped: 'bg-gray-100 text-gray-600',
};

const PROVIDER_COLORS: Record<string, string> = {
  stripe: 'bg-indigo-100 text-indigo-800',
  jotform: 'bg-orange-100 text-orange-800',
  calendly: 'bg-teal-100 text-teal-800',
  resend: 'bg-purple-100 text-purple-800',
  sezzle: 'bg-pink-100 text-pink-800',
  affirm: 'bg-cyan-100 text-cyan-800',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtRelative(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function ProviderCard({ p }: { p: ProviderHealth }) {
  const errorCount = (p.statusBreakdown['errored'] || 0) + (p.statusBreakdown['failed'] || 0);
  const errorRate = p.last24h > 0 ? Math.round((errorCount / p.last24h) * 100) : 0;

  return (
    <div className={`bg-white rounded-xl border-2 p-5 ${p.healthy ? 'border-gray-200' : 'border-red-300'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${PROVIDER_COLORS[p.provider] || 'bg-gray-100 text-gray-700'}`}>
          {p.provider}
        </span>
        {p.healthy
          ? <CheckCircle2 className="h-5 w-5 text-green-500" />
          : <AlertTriangle className="h-5 w-5 text-red-500" />}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-gray-500 text-xs">Last 24h</p>
          <p className="font-bold text-slate-900">{p.last24h}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">7d avg/day</p>
          <p className="font-bold text-slate-900">{p.baselineDailyAvg}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Error rate</p>
          <p className={`font-bold ${errorRate > 20 ? 'text-red-600' : 'text-slate-900'}`}>{errorRate}%</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Last event</p>
          <p className="font-medium text-slate-700 text-xs">{fmtRelative(p.lastEventAt)}</p>
        </div>
      </div>

      {/* Status breakdown mini-bar */}
      {p.last24h > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
          {Object.entries(p.statusBreakdown).map(([s, n]) => (
            <div
              key={s}
              title={`${s}: ${n}`}
              style={{ width: `${(n / p.last24h) * 100}%` }}
              className={
                s === 'processed' ? 'bg-green-400' :
                s === 'errored' || s === 'failed' ? 'bg-red-400' :
                s === 'skipped' ? 'bg-gray-300' :
                'bg-brand-blue-400'
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROVIDER_COLORS[provider] || 'bg-gray-100 text-gray-600'}`}>
      {provider}
    </span>
  );
}

// ─── Event Detail Drawer ───────────────────────────────────────────────────────

function EventDrawer({ event, onClose }: { event: WebhookEvent; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Webhook event detail"
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Event Detail</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{event.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <ProviderBadge provider={event.provider} />
            <StatusBadge status={event.status} />
          </div>

          {/* Core fields */}
          <dl className="space-y-3">
            <Field label="Event Type" value={event.event_type || '—'} mono />
            <Field label="Event ID" value={event.event_id || '—'} mono />
            <Field label="Payment Reference" value={event.payment_reference || '—'} mono />
            <Field label="Received At" value={fmtDate(event.received_at)} />
          </dl>

          {/* Error message */}
          {event.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">Error</p>
              <p className="text-sm text-red-800 font-mono break-all">{event.error_message}</p>
            </div>
          )}

          {/* Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Metadata</p>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className={`mt-0.5 text-sm text-slate-800 break-all ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function WebhookHealthDashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState('');

  const [events, setEvents] = useState<EventsData | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [filters, setFilters] = useState<Filters>({
    provider: '', status: '', event_type: '', from: '', to: '',
  });
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // ── Fetch summary ──────────────────────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError('');
    try {
      const res = await fetch('/api/admin/webhook-health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setHealthError(e instanceof Error ? e.message : 'Failed to load health data');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // ── Fetch events ───────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const params = new URLSearchParams({ mode: 'events', page: String(page) });
      if (filters.provider) params.set('provider', filters.provider);
      if (filters.status) params.set('status', filters.status);
      if (filters.event_type) params.set('event_type', filters.event_type);
      if (filters.from) params.set('from', new Date(filters.from).toISOString());
      if (filters.to) params.set('to', new Date(filters.to).toISOString());

      const res = await fetch(`/api/admin/webhook-health?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvents(await res.json());
    } catch {
      // keep stale data on error
    } finally {
      setEventsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Reset to page 1 when filters change
  const applyFilter = (key: keyof Filters, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ provider: '', status: '', event_type: '', from: '', to: '' });
    setPage(1);
  };

  const hasFilters = Object.values(filters).some(Boolean);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'System', href: '/admin/system-health' },
          { label: 'Webhooks' },
        ]} />

        {/* Page header */}
        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Zap className="h-8 w-8 text-brand-blue-600" />
              Webhook Health
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Last refreshed {fmtRelative(lastRefresh.toISOString())}
            </p>
          </div>
          <button
            onClick={() => { fetchHealth(); fetchEvents(); }}
            disabled={healthLoading || eventsLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${(healthLoading || eventsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Alerts banner */}
        {health?.alerts && health.alerts.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="font-semibold text-red-800">{health.alerts.length} alert{health.alerts.length > 1 ? 's' : ''}</p>
            </div>
            <ul className="space-y-1">
              {health.alerts.map((a, i) => (
                <li key={i} className="text-sm text-red-700">• {a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error state */}
        {healthError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {healthError}
          </div>
        )}

        {/* Summary cards */}
        {healthLoading && !health ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : health?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <SummaryCard label="Total (24h)" value={health.summary.total} icon={Activity} color="bg-brand-blue-100 text-brand-blue-700" />
            <SummaryCard label="Processed" value={health.summary.processed} icon={CheckCircle2} color="bg-green-100 text-green-700" />
            <SummaryCard label="Failed" value={health.summary.failed} icon={XCircle} color="bg-red-100 text-red-700" />
            <SummaryCard label="Errored" value={health.summary.errored} icon={AlertTriangle} color="bg-orange-100 text-orange-700" />
            <SummaryCard label="Skipped" value={health.summary.skipped} icon={SkipForward} color="bg-gray-100 text-gray-600" />
          </div>
        )}

        {/* Provider grid */}
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Provider Health</h2>
        {healthLoading && !health ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            {(health?.providers || []).map(p => (
              <ProviderCard key={p.provider} p={p} />
            ))}
          </div>
        )}

        {/* Event log */}
        <div className="bg-white rounded-xl border border-gray-200">
          {/* Table header + filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                Event Log
                {events && (
                  <span className="text-sm font-normal text-gray-500">
                    ({events.total.toLocaleString()} total)
                  </span>
                )}
              </h2>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brand-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Filter row */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.provider}
                onChange={e => applyFilter('provider', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                aria-label="Filter by provider"
              >
                <option value="">All providers</option>
                {PROVIDERS.filter(Boolean).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={e => applyFilter('status', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {STATUSES.filter(Boolean).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Event type (e.g. payment_intent.succeeded)"
                value={filters.event_type}
                onChange={e => applyFilter('event_type', e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500 w-72"
                aria-label="Filter by event type"
              />

              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={filters.from}
                  onChange={e => applyFilter('from', e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  aria-label="From date"
                />
                <span className="text-gray-500 text-sm">→</span>
                <input
                  type="datetime-local"
                  value={filters.to}
                  onChange={e => applyFilter('to', e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                  aria-label="To date"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Received</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {eventsLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : events?.events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No events match the current filters.
                    </td>
                  </tr>
                ) : (
                  events?.events.map(ev => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                        {fmtDate(ev.received_at)}
                      </td>
                      <td className="px-4 py-3">
                        <ProviderBadge provider={ev.provider} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[200px] truncate">
                        {ev.event_type || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ev.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[140px] truncate">
                        {ev.payment_reference || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-red-600 max-w-[180px] truncate">
                        {ev.error_message || ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {events && events.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {events.page} of {events.pages} ({events.total.toLocaleString()} events)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={events.page <= 1 || eventsLoading}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(events.pages, p + 1))}
                  disabled={events.page >= events.pages || eventsLoading}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event detail drawer */}
      {selectedEvent && (
        <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
