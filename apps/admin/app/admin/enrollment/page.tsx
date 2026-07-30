'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { Search, CheckCircle, Clock, XCircle, AlertTriangle, ChevronRight, Filter, Eye, Users } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  application: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  dropped: 'bg-slate-100 text-slate-700',
  withdrawn: 'bg-slate-100 text-slate-700',
};

const FUNDING_COLORS: Record<string, string> = {
  self: 'bg-slate-100 text-slate-700',
  wioa: 'bg-green-100 text-green-700',
  snap: 'bg-orange-100 text-orange-700',
  next_level_jobs: 'bg-blue-100 text-blue-700',
  employer: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-700',
};

export default function AdminEnrollmentPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/enrollment?limit=50' + (statusFilter ? `&status=${statusFilter}` : ''));
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      } else {
        // Fallback: load all from enrollment_v2
        const v2Res = await fetch('/api/enrollment-v2/apply');
        if (v2Res.ok) {
          const v2Data = await v2Res.json();
          setApplications(Array.isArray(v2Data) ? v2Data : []);
        }
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const filtered = applications.filter(app => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      app.first_name?.toLowerCase().includes(q) ||
      app.last_name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.confirmation_number?.toLowerCase().includes(q) ||
      app.program_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin/dashboard" className="hover:underline">Admin</Link>
              <ChevronRight className="w-3 h-3" />
              <span>Enrollment</span>
            </div>
            <h1 className="text-2xl font-bold">Enrollment Command Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={loadApplications} disabled={loading}
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats */}
        {loaded && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Applications', count: applications.length, color: 'bg-white' },
              { label: 'Pending Review', count: applications.filter((a: any) => a.enrollment_status === 'application').length, color: 'bg-yellow-50 border-yellow-200' },
              { label: 'Approved / Enrolled', count: applications.filter((a: any) => ['approved', 'enrolled', 'active'].includes(a.enrollment_status)).length, color: 'bg-green-50 border-green-200' },
              { label: 'Needs Funding', count: applications.filter((a: any) => a.funding_status === 'screening' || a.funding_status === 'pending_verification').length, color: 'bg-orange-50 border-orange-200' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.color} border border-slate-200 rounded-xl p-4`}>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or confirmation number..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-brand-blue-500 focus:outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setLoaded(false); }}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="application">Application</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="enrolled">Enrolled</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <button onClick={loadApplications} className="text-sm text-brand-blue-600 hover:underline font-medium">
            Load Applications
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Confirmation</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Applicant</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Program</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Funding</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Click "Load Applications" to view enrollment applications.</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No applications found.
                  </td>
                </tr>
              ) : (
                filtered.map((app, i) => (
                  <tr key={app.id} className={`border-b border-slate-100 hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-bold text-slate-700">{app.confirmation_number || app.id?.slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{app.first_name} {app.last_name}</p>
                        <p className="text-xs text-slate-500">{app.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{app.program_name || app.program_slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[app.enrollment_status] || 'bg-slate-100 text-slate-600'}`}>
                        {(app.enrollment_status || 'pending').toUpperCase().replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${FUNDING_COLORS[app.funding_source] || 'bg-slate-100 text-slate-600'}`}>
                        {(app.funding_source || 'self').toUpperCase().replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-slate-500">
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedApp(app)}
                          className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Review
                        </button>
                        <Link href={`/admin/applications/${app.id}`}
                          className="text-slate-500 hover:text-slate-700 text-sm">
                          Full →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Sidebar */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedApp(null)}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{selectedApp.first_name} {selectedApp.last_name}</h2>
                <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Confirmation</p>
                  <p className="font-mono font-bold">{selectedApp.confirmation_number}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Program</p>
                  <p className="font-bold">{selectedApp.program_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Status</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[selectedApp.enrollment_status] || ''}`}>
                      {selectedApp.enrollment_status?.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Funding</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${FUNDING_COLORS[selectedApp.funding_source] || ''}`}>
                      {selectedApp.funding_source?.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Contact</p>
                  <p className="text-sm">{selectedApp.email}</p>
                  <p className="text-sm text-slate-500">{selectedApp.phone || 'No phone'}</p>
                </div>
                {selectedApp.address_city && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Address</p>
                    <p className="text-sm">{selectedApp.address_line1}, {selectedApp.address_city}, {selectedApp.address_state} {selectedApp.address_zip}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Interview</p>
                    <p className="text-sm">{selectedApp.interview_status === 'completed' ? 'Completed' : 'Pending'}</p>
                    {selectedApp.interview_score && <p className="text-xs text-slate-500">Score: {selectedApp.interview_score}/100</p>}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Binder</p>
                    <p className="text-sm capitalize">{selectedApp.binder_status?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                {selectedApp.admin_notes && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Admin Notes</p>
                    <p className="text-sm text-slate-600">{selectedApp.admin_notes}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Link href={`/admin/applications/${selectedApp.id}`}
                    className="flex-1 text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm">
                    Full Application
                  </Link>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm">
                    Approve
                  </button>
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors text-sm">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
