'use client';

import { useState } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle, Download, Search } from 'lucide-react';

type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'denied';

interface SnapEtApplication {
  id: string;
  applicant_name: string;
  ssn_last_four: string;
  date_of_birth: string;
  program_name: string;
  requested_amount: number;
  status: ApplicationStatus;
  submitted_date?: string;
  decision_date?: string;
  case_number?: string;
}

export default function SnapEtClient() {
  const [applications, setApplications] = useState<SnapEtApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ApplicationStatus | 'all'>('all');
  const [totalApproved, setTotalApproved] = useState(0);
  const [totalPending, setTotalPending] = useState(0);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/grants/snap-et?${params}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setTotalApproved(data.totalApproved || 0);
        setTotalPending(data.totalPending || 0);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'denied':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800"><AlertCircle className="w-3 h-3" /> Denied</span>;
      case 'under_review':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"><Clock className="w-3 h-3" /> Under Review</span>;
      case 'submitted':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Submitted</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">Draft</span>;
    }
  };

  const filteredApplications = applications.filter(app =>
    app.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
    app.case_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">SNAP E&T Applications</h1>
        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Approved</p>
              <p className="text-xl font-bold text-slate-900">${totalApproved.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="text-xl font-bold text-slate-900">{totalPending}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or case number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as ApplicationStatus | 'all')}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Applicant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Case #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{app.applicant_name}</p>
                      <p className="text-xs text-slate-500">DOB: {app.date_of_birth}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{app.program_name}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium">${app.requested_amount.toLocaleString()}</td>
                    <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-sm">{app.case_number || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
