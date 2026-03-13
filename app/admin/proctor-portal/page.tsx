'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Shield, Plus, Search, Filter, Download, FileText, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import NewSessionForm from './NewSessionForm';
import SessionRow from './SessionRow';
import type { ExamSession, ExamProvider, ExamResult } from './types';
import { PROVIDER_LABELS, RESULT_LABELS } from './types';

export default function ProctorPortalPage() {
  const supabase = createClient();
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSession, setEditSession] = useState<ExamSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<ExamProvider | ''>('');
  const [resultFilter, setResultFilter] = useState<ExamResult | ''>('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'flagged' | 'under_review' | 'invalidated'>('all');
  const [sortField, setSortField] = useState<'created_at' | 'student_name'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('exam_sessions')
      .select('*')
      .order(sortField, { ascending: sortDir === 'asc' })
      .limit(100);

    if (providerFilter) query = query.eq('provider', providerFilter);
    if (resultFilter) query = query.eq('result', resultFilter);
    if (reviewFilter !== 'all') query = query.eq('review_status', reviewFilter);
    if (searchTerm) query = query.or(`student_name.ilike.%${searchTerm}%,student_email.ilike.%${searchTerm}%`);

    const { data, error } = await query;
    if (!error && data) setSessions(data as ExamSession[]);
    setLoading(false);
  }, [supabase, sortField, sortDir, providerFilter, resultFilter, reviewFilter, searchTerm]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSaved = () => {
    setShowForm(false);
    setEditSession(null);
    fetchSessions();
  };

  const handleEdit = (session: ExamSession) => {
    setEditSession(session);
    setShowForm(true);
  };

  const toggleSort = (field: 'created_at' | 'student_name') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const exportCSV = () => {
    const headers = ['Date', 'Student', 'Email', 'Provider', 'Exam', 'Delivery', 'ID Verified', 'Status', 'Result', 'Score', 'Proctor', 'Retest', 'Notes'];
    const rows = sessions.map(s => [
      s.created_at?.slice(0, 10) || '',
      s.student_name,
      s.student_email || '',
      PROVIDER_LABELS[s.provider],
      s.exam_name,
      s.delivery_method,
      s.id_verified ? 'Yes' : 'No',
      s.status,
      s.result,
      s.score?.toString() || '',
      s.proctor_name,
      s.is_retest ? 'Yes' : 'No',
      (s.proctor_notes || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: sessions.length,
    pass: sessions.filter(s => s.result === 'pass').length,
    fail: sessions.filter(s => s.result === 'fail').length,
    pending: sessions.filter(s => s.result === 'pending').length,
    flagged: sessions.filter(s => s.review_status === 'flagged').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Proctor Portal' },
      ]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-brand-blue-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Proctor Portal</h1>
              <p className="text-sm text-slate-500">EPA 608, Certiport, OSHA — exam session tracking and audit trail</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => { setEditSession(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-blue-600 rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-4 h-4" /> Log Exam Session
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Sessions', value: stats.total, color: 'text-slate-900' },
            { label: 'Passed', value: stats.pass, color: 'text-brand-green-600' },
            { label: 'Failed', value: stats.fail, color: 'text-brand-red-600' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Flagged', value: stats.flagged, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by student name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
              />
            </div>
            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value as ExamProvider | '')}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="">All Providers</option>
              {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={resultFilter}
              onChange={e => setResultFilter(e.target.value as ExamResult | '')}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            >
              <option value="">All Results</option>
              {Object.entries(RESULT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={reviewFilter}
              onChange={e => setReviewFilter(e.target.value as typeof reviewFilter)}
              className={`px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-brand-blue-500 ${
                reviewFilter !== 'all'
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'border-slate-300'
              }`}
            >
              <option value="all">All Review Status</option>
              <option value="flagged">Flagged</option>
              <option value="under_review">Under Review</option>
              <option value="invalidated">Invalidated</option>
            </select>
          </div>
        </div>

        {/* New/Edit Session Form */}
        {showForm && (
          <div className="mb-6">
            <NewSessionForm
              session={editSession}
              onSaved={handleSaved}
              onCancel={() => { setShowForm(false); setEditSession(null); }}
            />
          </div>
        )}

        {/* Sessions Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 cursor-pointer" onClick={() => toggleSort('created_at')}>
                    Date <SortIcon field="created_at" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600 cursor-pointer" onClick={() => toggleSort('student_name')}>
                    Student <SortIcon field="student_name" />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Provider</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Exam</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Delivery</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Result</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Score</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">Loading sessions...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No exam sessions recorded yet. Click &quot;Log Exam Session&quot; to create the first record.
                  </td></tr>
                ) : (
                  sessions.map(s => <SessionRow key={s.id} session={s} onEdit={handleEdit} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
