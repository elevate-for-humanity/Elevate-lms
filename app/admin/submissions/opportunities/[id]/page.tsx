'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, Calendar, Building2, Hash,
  DollarSign, Save, Loader2, AlertTriangle, CheckCircle2,
  Plus, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Opportunity = {
  id: string;
  title: string;
  issuer_name: string | null;
  opportunity_type: string;
  status: string;
  submission_method: string | null;
  portal_url: string | null;
  issue_date: string | null;
  due_date: string | null;
  questions_deadline: string | null;
  estimated_value: number | null;
  eligibility_text: string | null;
  scope_summary: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
};

type Requirement = {
  id: string;
  requirement_category: string;
  requirement_name: string;
  description: string | null;
  required: boolean;
  response_format: string | null;
  word_limit: number | null;
  review_class: string | null;
  sort_order: number;
};

const STATUSES = ['profiling','go','no_go','in_progress','submitted','awarded','not_awarded','archived'];
const OPP_TYPES = ['grant','rfp','rfq','rfi','bid','contract','vendor_registration','other'];
const REVIEW_CLASSES = ['auto_safe','ask_if_missing','review_required','blocked'];

const REVIEW_CLASS_COLORS: Record<string, string> = {
  auto_safe:      'bg-green-100 text-green-800',
  ask_if_missing: 'bg-amber-100 text-amber-800',
  review_required:'bg-orange-100 text-orange-800',
  blocked:        'bg-red-100 text-red-800',
};

export default function OpportunityProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [reqs, setReqs] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddReq, setShowAddReq] = useState(false);
  const [newReq, setNewReq] = useState({ requirement_category: '', requirement_name: '', description: '', required: true, review_class: 'ask_if_missing' });

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: oppData }, { data: reqData }] = await Promise.all([
      supabase.from('sos_opportunities').select('*').eq('id', id).maybeSingle(),
      supabase.from('sos_opportunity_requirements').select('*').eq('opportunity_id', id).order('sort_order'),
    ]);
    if (oppData) setOpp(oppData as Opportunity);
    setReqs((reqData ?? []) as Requirement[]);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!opp) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('sos_opportunities')
      .update({
        title: opp.title,
        issuer_name: opp.issuer_name,
        opportunity_type: opp.opportunity_type,
        status: opp.status,
        submission_method: opp.submission_method,
        portal_url: opp.portal_url,
        issue_date: opp.issue_date || null,
        due_date: opp.due_date || null,
        questions_deadline: opp.questions_deadline || null,
        estimated_value: opp.estimated_value,
        eligibility_text: opp.eligibility_text,
        scope_summary: opp.scope_summary,
        reference_number: opp.reference_number,
        notes: opp.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleAddReq() {
    if (!newReq.requirement_name.trim() || !newReq.requirement_category.trim()) return;
    const { data, error: err } = await supabase
      .from('sos_opportunity_requirements')
      .insert({ opportunity_id: id, ...newReq, sort_order: reqs.length + 1 })
      .select()
      .single();
    if (err || !data) { setError(err?.message ?? 'Failed to add requirement'); return; }
    setReqs(prev => [...prev, data as Requirement]);
    setNewReq({ requirement_category: '', requirement_name: '', description: '', required: true, review_class: 'ask_if_missing' });
    setShowAddReq(false);
  }

  async function handleDeleteReq(reqId: string) {
    await supabase.from('sos_opportunity_requirements').delete().eq('id', reqId);
    setReqs(prev => prev.filter(r => r.id !== reqId));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Opportunity not found.</p>
        <Link href="/admin/submissions/opportunities" className="text-brand-blue-600 hover:underline text-sm">
          ← Back to Opportunities
        </Link>
      </div>
    );
  }

  const field = (key: keyof Opportunity) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setOpp(prev => prev ? { ...prev, [key]: e.target.value } : prev);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <button onClick={() => router.push('/admin/submissions/opportunities')} className="text-slate-400 hover:text-slate-600 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-mono mb-1">{opp.id.slice(0, 8)}</p>
            <h1 className="text-xl font-bold text-slate-900 leading-snug">{opp.title}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
              {opp.issuer_name && <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{opp.issuer_name}</span>}
              {opp.due_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Due {new Date(opp.due_date).toLocaleDateString()}</span>}
              {opp.portal_url && (
                <a href={opp.portal_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-blue-600 hover:underline">
                  Source <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 disabled:opacity-50 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        <div className="space-y-6">

          {/* Status & Classification */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Status & Classification</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select value={opp.status} onChange={field('status')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                <select value={opp.opportunity_type} onChange={field('opportunity_type')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                  {OPP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Submission Method</label>
                <input value={opp.submission_method ?? ''} onChange={field('submission_method')} placeholder="e.g. Grants.gov, email, portal" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
              </div>
            </div>
          </section>

          {/* Core Details */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Core Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                <input value={opp.title} onChange={field('title')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Issuer / Funder</label>
                  <input value={opp.issuer_name ?? ''} onChange={field('issuer_name')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" />Reference #</label>
                  <input value={opp.reference_number ?? ''} onChange={field('reference_number')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Portal URL</label>
                  <input type="url" value={opp.portal_url ?? ''} onChange={field('portal_url')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" />Estimated Value ($)</label>
                  <input type="number" value={opp.estimated_value ?? ''} onChange={e => setOpp(prev => prev ? { ...prev, estimated_value: e.target.value ? Number(e.target.value) : null } : prev)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Key Dates</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {([
                ['issue_date', 'Issue / Release Date'],
                ['questions_deadline', 'Questions Deadline'],
                ['due_date', 'Submission Deadline'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input type="date" value={opp[key] ?? ''} onChange={field(key)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                </div>
              ))}
            </div>
          </section>

          {/* Narrative */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Scope & Eligibility</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Scope Summary</label>
                <textarea rows={4} value={opp.scope_summary ?? ''} onChange={field('scope_summary')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Eligibility Text</label>
                <textarea rows={3} value={opp.eligibility_text ?? ''} onChange={field('eligibility_text')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Internal Notes</label>
                <textarea rows={2} value={opp.notes ?? ''} onChange={field('notes')} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" />
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Requirements</h2>
                <p className="text-xs text-slate-400 mt-0.5">Map each submission requirement to a review classification.</p>
              </div>
              <button
                onClick={() => setShowAddReq(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-brand-blue-50 hover:border-brand-blue-300 hover:text-brand-blue-700 transition"
              >
                {showAddReq ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showAddReq ? 'Cancel' : 'Add Requirement'}
              </button>
            </div>

            {showAddReq && (
              <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                    <input value={newReq.requirement_category} onChange={e => setNewReq(p => ({ ...p, requirement_category: e.target.value }))} placeholder="e.g. Narrative, Budget, Attachment" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Requirement Name</label>
                    <input value={newReq.requirement_name} onChange={e => setNewReq(p => ({ ...p, requirement_name: e.target.value }))} placeholder="e.g. Organization Overview" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Review Class</label>
                    <select value={newReq.review_class} onChange={e => setNewReq(p => ({ ...p, review_class: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                      {REVIEW_CLASSES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input type="checkbox" id="req-required" checked={newReq.required} onChange={e => setNewReq(p => ({ ...p, required: e.target.checked }))} className="rounded" />
                    <label htmlFor="req-required" className="text-sm text-slate-700">Required</label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <textarea rows={2} value={newReq.description} onChange={e => setNewReq(p => ({ ...p, description: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none" />
                </div>
                <button onClick={handleAddReq} className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-blue-700 transition">
                  Add
                </button>
              </div>
            )}

            {reqs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No requirements mapped yet.</p>
            ) : (
              <div className="space-y-2">
                {reqs.map(req => (
                  <div key={req.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{req.requirement_category}</span>
                        {req.review_class && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${REVIEW_CLASS_COLORS[req.review_class] ?? 'bg-slate-100 text-slate-600'}`}>
                            {req.review_class.replace(/_/g, ' ')}
                          </span>
                        )}
                        {!req.required && <span className="text-xs text-slate-400">optional</span>}
                      </div>
                      <p className="text-sm font-medium text-slate-800">{req.requirement_name}</p>
                      {req.description && <p className="text-xs text-slate-500 mt-0.5">{req.description}</p>}
                    </div>
                    <button onClick={() => handleDeleteReq(req.id)} className="text-slate-300 hover:text-red-500 transition flex-shrink-0 mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
