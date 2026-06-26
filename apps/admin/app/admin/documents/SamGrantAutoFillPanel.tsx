'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Wand2, Send, Clock3, Download } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

type GrantRow = {
  opportunityId: string;
  title: string;
  agency: string;
  closeDate: string | null;
  awardFloor: string | number | null;
  awardCeiling: string | number | null;
  url: string | null;
  description: string;
};

type TimelineEvent = {
  id: string;
  action: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export default function SamGrantAutoFillPanel() {
  const [keyword, setKeyword] = useState('workforce development');
  const [agency, setAgency] = useState('Department of Labor');
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [grants, setGrants] = useState<GrantRow[]>([]);
  const [selected, setSelected] = useState<GrantRow | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [resultFiles, setResultFiles] = useState<Array<{ type: string; signedUrl: string | null }>>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedSummary = useMemo(() => {
    if (!selected) return 'No grant selected yet.';
    return `${selected.title} (${selected.opportunityId || 'N/A'})`;
  }, [selected]);

  async function loadTimeline() {
    setTimelineLoading(true);
    try {
      const res = await fetch('/api/admin/grants/sam/timeline?limit=30');
      const data = await res.json();
      if (res.ok) setTimeline(Array.isArray(data.events) ? data.events : []);
    } finally {
      setTimelineLoading(false);
    }
  }

  useEffect(() => {
    loadTimeline();
    searchSamGrants();
    // Auto-lookup once on mount with default keyword + agency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchSamGrants() {
    setLoadingSearch(true);
    setError('');
    setSuccess('');
    setGrants([]);
    setSelected(null);
    try {
      const params = new URLSearchParams({
        keyword,
        agency,
        limit: '25',
      });
      const res = await fetch(`/api/admin/grants/sam/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Grant lookup failed');
      setGrants(Array.isArray(data.grants) ? data.grants : []);
      if (Array.isArray(data.grants) && data.grants.length > 0) {
        setSelected(data.grants[0]);
      }
      setSuccess(`Found ${Array.isArray(data.grants) ? data.grants.length : 0} grant opportunities.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grant lookup failed');
    } finally {
      setLoadingSearch(false);
    }
  }

  async function generatePrefillPackage() {
    if (!selected) {
      setError('Pick a grant result first.');
      return;
    }

    setLoadingGenerate(true);
    setError('');
    setSuccess('');
    setResultFiles([]);

    try {
      const res = await fetch('/api/admin/grants/sam/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant: selected,
          organization: {
            legalName: `${PLATFORM_DEFAULTS.orgName} Career & Technical Institute`,
            contactEmail: `info@${PLATFORM_DEFAULTS.canonicalDomain}`,
            contactPhone: PLATFORM_DEFAULTS.supportPhone,
            address: '8888 Keystone Crossing, Suite 1300',
            city: 'Indianapolis',
            state: 'IN',
            zip: '46240',
          },
          project: {
            title: `Grant Application - ${selected.title}`,
            summary:
              'This draft was auto-prefilled from SAM.gov feed data. Update narrative and budget before final submission.',
          },
          output: {
            createDocx: true,
            createPdf: true,
            emailTo: emailTo.trim() || undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Prefill package generation failed');

      setResultFiles(Array.isArray(data.files) ? data.files : []);
      setSuccess('Prefill package generated and saved to Documents.');
      await loadTimeline();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Package generation failed');
    } finally {
      setLoadingGenerate(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold text-slate-900">SAM.gov Grant Auto-Fill</h2>
        <div className="text-xs text-slate-500">Lookup grants | prefill docs | email package | timeline</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Keyword"
        />
        <input
          value={agency}
          onChange={(e) => setAgency(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
          placeholder="Agency"
        />
        <button
          onClick={searchSamGrants}
          disabled={loadingSearch}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loadingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search Grants
        </button>
      </div>

      {grants.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Grant Feed Results ({grants.length})
          </div>
          <div className="max-h-44 overflow-auto divide-y divide-slate-100">
            {grants.map((g) => (
              <button
                key={`${g.opportunityId}-${g.title}`}
                onClick={() => setSelected(g)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${selected?.opportunityId === g.opportunityId ? 'bg-brand-blue-50' : ''}`}
              >
                <div className="font-semibold text-slate-900 truncate">{g.title}</div>
                <div className="text-xs text-slate-500 truncate">
                  {g.opportunityId || 'N/A'} · {g.agency || 'Unknown agency'}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="text-sm text-slate-600">
        <span className="font-semibold">Selected:</span> {selectedSummary}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 mb-1">Email Package To (optional)</label>
          <input
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            placeholder="grants@yourorg.org"
          />
        </div>
        <button
          onClick={generatePrefillPackage}
          disabled={loadingGenerate || !selected}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {loadingGenerate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Generate Prefill Package
        </button>
      </div>

      {resultFiles.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
          <div className="text-sm font-semibold text-emerald-800">Generated Files</div>
          <div className="flex flex-wrap gap-2">
            {resultFiles.map((f, idx) => (
              f.signedUrl ? (
                <a
                  key={`${f.type}-${idx}`}
                  href={f.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-800 hover:bg-white"
                >
                  <Download className="w-3 h-3" /> {f.type.toUpperCase()}
                </a>
              ) : (
                <span
                  key={`${f.type}-${idx}`}
                  className="inline-flex items-center gap-1 rounded border border-emerald-200 px-2 py-1 text-xs text-emerald-400 cursor-not-allowed"
                  title="File not available"
                >
                  <Download className="w-3 h-3" /> {f.type.toUpperCase()}
                </span>
              )
            ))}
          </div>
        </div>
      )}

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-emerald-700">{success}</div> : null}

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider inline-flex items-center gap-1">
          <Clock3 className="w-3.5 h-3.5" /> Timeline
        </div>
        <div className="max-h-52 overflow-auto divide-y divide-slate-100">
          {timelineLoading ? (
            <div className="px-3 py-3 text-sm text-slate-500 inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading timeline...
            </div>
          ) : timeline.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-500">No SAM autofill events yet.</div>
          ) : (
            timeline.map((item) => (
              <div key={item.id} className="px-3 py-2">
                <div className="text-sm font-medium text-slate-800">{item.action}</div>
                <div className="text-xs text-slate-500">
                  {item.resource_id || '—'} · {new Date(item.created_at).toLocaleString('en-US')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 inline-flex items-center gap-2">
        <Send className="w-3.5 h-3.5" /> Uses configured SendGrid keys from app secrets.
      </div>
    </div>
  );
}
