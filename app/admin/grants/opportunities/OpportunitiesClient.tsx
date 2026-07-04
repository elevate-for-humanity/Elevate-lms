'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, Loader2, AlertTriangle, ExternalLink, BookmarkPlus,
  CheckCircle2, Calendar, DollarSign, Building2, X, Filter,
} from 'lucide-react';

type CachedOpp = {
  id: string;
  title: string;
  agency_name: string | null;
  opportunity_number: string | null;
  cfda_number: string | null;
  close_date: string | null;
  award_ceiling: number | null;
  award_floor: number | null;
  status: string | null;
  source: string | null;
  opportunity_url: string | null;
  description: string | null;
  imported_at: string;
};

type SearchResult = {
  opportunityId: string;
  title: string;
  agency: string;
  closeDate: string | null;
  postedDate: string | null;
  awardFloor: number | null;
  awardCeiling: number | null;
  url: string | null;
  category: string;
  description: string;
};

function fmt$(n: number | null | undefined) {
  if (!n) return '—';
  return '$' + n.toLocaleString();
}

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(s: string | null | undefined) {
  if (!s) return null;
  const d = Math.ceil((new Date(s).getTime() - Date.now()) / 86400000);
  return d;
}

export default function OpportunitiesClient({ cached }: { cached: CachedOpp[] }) {
  const [keyword, setKeyword] = useState('workforce development');
  const [agency, setAgency] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<'search' | 'saved'>('saved');

  async function search() {
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const params = new URLSearchParams({ keyword, limit: '25' });
      if (agency) params.set('agency', agency);
      const res = await fetch(`/api/admin/grants/sam/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setResults(data.grants ?? []);
      setTab('search');
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  }

  async function saveOpportunity(r: SearchResult) {
    setSaving(r.opportunityId);
    try {
      const res = await fetch('/api/admin/grants/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'sam_gov',
          opportunity_number: r.opportunityId,
          title: r.title,
          agency_name: r.agency,
          close_date: r.closeDate,
          posted_date: r.postedDate,
          award_ceiling: r.awardCeiling,
          award_floor: r.awardFloor,
          opportunity_url: r.url,
          description: r.description,
          status: 'posted',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved(prev => new Set([...prev, r.opportunityId]));
    } catch (e: unknown) {
      setSearchError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 mb-1">Keywords</label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="workforce development, training, education..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-xs font-medium text-slate-600 mb-1">Agency (optional)</label>
            <input
              type="text"
              value={agency}
              onChange={e => setAgency(e.target.value)}
              placeholder="DOL, HHS, SBA..."
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={search}
              disabled={searching}
              className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search SAM.gov
            </button>
          </div>
        </div>

        {searchError && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {searchError}
            <button onClick={() => setSearchError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(['saved', 'search'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'saved' ? `Saved (${cached.length})` : `Search Results${results ? ` (${results.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Saved opportunities */}
      {tab === 'saved' && (
        <div className="space-y-3">
          {cached.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BookmarkPlus className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No saved opportunities yet.</p>
              <p className="text-xs text-slate-400 mt-1">Search SAM.gov above and save opportunities to track them.</p>
            </div>
          ) : (
            cached.map(opp => {
              const days = daysUntil(opp.close_date);
              const urgent = days !== null && days <= 14 && days >= 0;
              return (
                <div key={opp.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {urgent && (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            {days === 0 ? 'Due today' : `${days}d left`}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{opp.source ?? 'sam_gov'}</span>
                        {opp.opportunity_number && (
                          <span className="text-xs font-mono text-slate-400">{opp.opportunity_number}</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">{opp.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {opp.agency_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {opp.agency_name}
                          </span>
                        )}
                        {opp.close_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Closes {fmtDate(opp.close_date)}
                          </span>
                        )}
                        {(opp.award_ceiling || opp.award_floor) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {fmt$(opp.award_floor)} – {fmt$(opp.award_ceiling)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {opp.opportunity_url && (
                        <a
                          href={opp.opportunity_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/admin/grants/applications/new?opportunity_id=${opp.id}&title=${encodeURIComponent(opp.title)}`}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
                      >
                        Apply
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Search results */}
      {tab === 'search' && (
        <div className="space-y-3">
          {!results ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Run a search to see results.</p>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-500">No results found. Try different keywords.</p>
            </div>
          ) : (
            results.map(r => {
              const isSaved = saved.has(r.opportunityId);
              const isSaving = saving === r.opportunityId;
              const days = daysUntil(r.closeDate);
              const urgent = days !== null && days <= 14 && days >= 0;
              return (
                <div key={r.opportunityId} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {urgent && (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            {days === 0 ? 'Due today' : `${days}d left`}
                          </span>
                        )}
                        {r.category && <span className="text-xs text-slate-400">{r.category}</span>}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">{r.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        {r.agency && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> {r.agency}
                          </span>
                        )}
                        {r.closeDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Closes {fmtDate(r.closeDate)}
                          </span>
                        )}
                        {(r.awardCeiling || r.awardFloor) && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {fmt$(r.awardFloor)} – {fmt$(r.awardCeiling)}
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="mt-2 text-xs text-slate-500 line-clamp-2">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => saveOpportunity(r)}
                        disabled={isSaving || isSaved}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:border-violet-300 hover:text-violet-700 disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> :
                         isSaved ? <CheckCircle2 className="w-3 h-3 text-green-600" /> :
                         <BookmarkPlus className="w-3 h-3" />}
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
