'use client';

/**
 * /admin/submissions/opportunities
 *
 * Opportunity pipeline for the External Submissions OS.
 * Lists all sos_opportunities rows, allows adding new ones via URL ingestion,
 * and links to per-opportunity profiling.
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign, Plus, ExternalLink, Clock, CheckCircle2,
  XCircle, AlertTriangle, ArrowLeft, Loader2, Link2,
  Calendar, Building2, Hash, ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

type Opportunity = {
  id: string;
  title: string;
  issuer_name: string | null;
  opportunity_type: string;
  status: string;
  due_date: string | null;
  estimated_value: number | null;
  reference_number: string | null;
  portal_url: string | null;
  scope_summary: string | null;
  created_at: string;
};

type Organization = {
  id: string;
  legal_name: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  profiling:   { label: 'Profiling',   color: 'bg-amber-100 text-amber-800',   icon: Clock },
  go:          { label: 'Go',          color: 'bg-green-100 text-green-800',   icon: CheckCircle2 },
  no_go:       { label: 'No-Go',       color: 'bg-red-100 text-red-800',       icon: XCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800',     icon: Loader2 },
  submitted:   { label: 'Submitted',   color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
  awarded:     { label: 'Awarded',     color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  not_awarded: { label: 'Not Awarded', color: 'bg-slate-100 text-slate-600',   icon: XCircle },
  archived:    { label: 'Archived',    color: 'bg-slate-100 text-slate-400',   icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  grant: 'Grant', rfp: 'RFP', rfq: 'RFQ', rfi: 'RFI',
  bid: 'Bid', contract: 'Contract', vendor_registration: 'Vendor Reg.', other: 'Other',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-100 text-slate-600', icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatCurrency(val: number | null): string {
  if (!val) return '—';
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString()}`;
}

function daysUntil(dateStr: string | null): { label: string; urgent: boolean } {
  if (!dateStr) return { label: '—', urgent: false };
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: 'Past due', urgent: true };
  if (diff === 0) return { label: 'Due today', urgent: true };
  if (diff <= 7) return { label: `${diff}d left`, urgent: true };
  return { label: `${diff}d`, urgent: false };
}

// ── Ingest modal ──────────────────────────────────────────────────────────────

function IngestModal({
  organizations,
  onClose,
  onSuccess,
}: {
  organizations: Organization[];
  onClose: () => void;
  onSuccess: (opportunityId: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ opportunity_id: string; fetch_status: string; extracted: Record<string, unknown> } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions/ingest-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, organization_id: orgId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ingestion failed'); return; }
      setResult(data);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-brand-blue-600" />
            Ingest Opportunity Link
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Paste the URL of an RFP, grant notice, or bid posting. The system will fetch the page and extract metadata into a draft opportunity.
          </p>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Opportunity URL</label>
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://grants.gov/..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            {organizations.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Submitting Organization</label>
                <select
                  value={orgId}
                  onChange={e => setOrgId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                >
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.legal_name}</option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !url || !orgId}
                className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching…</> : 'Ingest Link'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${result.fetch_status === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
              {result.fetch_status === 'success'
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {result.fetch_status === 'success'
                ? 'Page fetched and metadata extracted.'
                : `Fetch status: ${result.fetch_status}. Opportunity created with partial data — edit to complete.`}
            </div>

            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1.5">
              <p><span className="text-slate-500">Title:</span> <span className="font-medium text-slate-900">{String(result.extracted.title)}</span></p>
              <p><span className="text-slate-500">Issuer:</span> {String(result.extracted.issuer_name ?? '—')}</p>
              <p><span className="text-slate-500">Type:</span> {TYPE_LABELS[String(result.extracted.opportunity_type)] ?? String(result.extracted.opportunity_type)}</p>
              <p><span className="text-slate-500">Due:</span> {String(result.extracted.due_date ?? '—')}</p>
              <p><span className="text-slate-500">Value:</span> {formatCurrency(result.extracted.estimated_value as number | null)}</p>
              {result.extracted.reference_number && (
                <p><span className="text-slate-500">Ref #:</span> <span className="font-mono text-xs">{String(result.extracted.reference_number)}</span></p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => onSuccess(result.opportunity_id)}
                className="flex-1 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition flex items-center justify-center gap-1"
              >
                Open Opportunity <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['profiling', 'go', 'in_progress'];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all' | 'submitted' | 'archived'>('active');
  const [showIngest, setShowIngest] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: opps }, { data: orgs }] = await Promise.all([
      supabase
        .from('sos_opportunities')
        .select('id,title,issuer_name,opportunity_type,status,due_date,estimated_value,reference_number,portal_url,scope_summary,created_at')
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('sos_organizations')
        .select('id,legal_name')
        .order('legal_name'),
    ]);
    setOpportunities((opps ?? []) as Opportunity[]);
    setOrganizations((orgs ?? []) as Organization[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const filtered = opportunities.filter(o => {
    if (filter === 'active') return ACTIVE_STATUSES.includes(o.status);
    if (filter === 'submitted') return ['submitted', 'awarded', 'not_awarded'].includes(o.status);
    if (filter === 'archived') return o.status === 'archived';
    return true;
  });

  const counts = {
    active: opportunities.filter(o => ACTIVE_STATUSES.includes(o.status)).length,
    submitted: opportunities.filter(o => ['submitted', 'awarded', 'not_awarded'].includes(o.status)).length,
    archived: opportunities.filter(o => o.status === 'archived').length,
    all: opportunities.length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/submissions" className="text-slate-400 hover:text-slate-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-brand-blue-600" />
              Opportunities
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Grants, RFPs, contracts, bids — full pipeline</p>
          </div>
          <button
            onClick={() => setShowIngest(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add from URL
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-6 w-fit">
          {([
            ['active', 'Active'],
            ['submitted', 'Submitted'],
            ['archived', 'Archived'],
            ['all', 'All'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === key
                  ? 'bg-brand-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${filter === key ? 'text-blue-200' : 'text-slate-400'}`}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No opportunities yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Click <strong>Add from URL</strong> to ingest an RFP, grant notice, or bid posting.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(opp => {
              const due = daysUntil(opp.due_date);
              return (
                <div key={opp.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:shadow-sm transition">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={opp.status} />
                        <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          {TYPE_LABELS[opp.opportunity_type] ?? opp.opportunity_type}
                        </span>
                        {opp.reference_number && (
                          <span className="text-xs font-mono text-slate-400 flex items-center gap-0.5">
                            <Hash className="w-3 h-3" />{opp.reference_number}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-1">
                        {opp.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {opp.issuer_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />{opp.issuer_name}
                          </span>
                        )}
                        {opp.due_date && (
                          <span className={`flex items-center gap-1 ${due.urgent ? 'text-red-600 font-semibold' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            Due {new Date(opp.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' '}
                            <span className={`px-1.5 py-0.5 rounded ${due.urgent ? 'bg-red-50' : 'bg-slate-50'}`}>
                              {due.label}
                            </span>
                          </span>
                        )}
                        {opp.estimated_value && (
                          <span className="flex items-center gap-1 text-green-700 font-medium">
                            <DollarSign className="w-3 h-3" />{formatCurrency(opp.estimated_value)}
                          </span>
                        )}
                      </div>

                      {opp.scope_summary && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {opp.scope_summary}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {opp.portal_url && (
                        <a
                          href={opp.portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
                        >
                          Source <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <Link
                        href={`/admin/submissions/opportunities/${opp.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-brand-blue-50 hover:border-brand-blue-300 hover:text-brand-blue-700 transition"
                      >
                        Profile <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showIngest && (
        <IngestModal
          organizations={organizations}
          onClose={() => setShowIngest(false)}
          onSuccess={(id) => {
            setShowIngest(false);
            window.location.href = `/admin/submissions/opportunities/${id}`;
          }}
        />
      )}
    </div>
  );
}
