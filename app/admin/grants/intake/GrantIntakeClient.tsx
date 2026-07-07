'use client';

import { useState } from 'react';
import { FileText, CheckCircle, AlertCircle, Loader2, Search } from 'lucide-react';

type GrantStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

interface Grant {
  id: string;
  student_name: string;
  program: string;
  grant_type: string;
  amount: number;
  status: GrantStatus;
  submitted_date: string;
}

export default function GrantIntakeClient() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GrantStatus | 'all'>('all');

  const fetchGrants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/grants?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGrants(data.grants || []);
      }
    } catch (err) {
      console.error('Failed to fetch grants:', err);
    }
    setLoading(false);
  };

  const getStatusColor = (status: GrantStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredGrants = grants.filter(g =>
    g.student_name.toLowerCase().includes(search.toLowerCase()) ||
    g.program.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Grant Intake</h1>
        <button
          onClick={fetchGrants}
          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search grants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as GrantStatus | 'all')}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredGrants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    No grants found
                  </td>
                </tr>
              ) : (
                filteredGrants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{grant.student_name}</td>
                    <td className="px-4 py-3 text-slate-600">{grant.program}</td>
                    <td className="px-4 py-3 text-slate-600">{grant.grant_type}</td>
                    <td className="px-4 py-3 text-slate-600">${grant.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStatusColor(grant.status)}`}>
                        {grant.status}
                      </span>
                    </td>
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
