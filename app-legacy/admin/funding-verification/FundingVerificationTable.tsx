'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';

type VerificationStatus = 'pending' | 'verified' | 'rejected';

interface FundingRecord {
  id: string;
  student_name: string;
  funding_source: string;
  amount: number;
  status: VerificationStatus;
  submitted_date: string;
  verified_by?: string;
}

export default function FundingVerificationTable() {
  const [records, setRecords] = useState<FundingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VerificationStatus | 'all'>('all');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/admin/funding-verification?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    }
    setLoading(false);
  };

  const verifyRecord = async (id: string, action: 'verify' | 'reject') => {
    try {
      const res = await fetch(`/api/admin/funding-verification/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setRecords(records.map(r => 
          r.id === id 
            ? { ...r, status: action === 'verify' ? 'verified' : 'rejected' as VerificationStatus }
            : r
        ));
      }
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const filteredRecords = records.filter(r =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.funding_source.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Funding Verification</h1>
        <button
          onClick={fetchRecords}
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
            placeholder="Search by student or funding source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as VerificationStatus | 'all')}
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Funding Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Submitted</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <span className="capitalize">{record.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{record.student_name}</td>
                    <td className="px-4 py-3 text-slate-600">{record.funding_source}</td>
                    <td className="px-4 py-3 text-slate-600">${record.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{record.submitted_date}</td>
                    <td className="px-4 py-3 text-right">
                      {record.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => verifyRecord(record.id, 'verify')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => verifyRecord(record.id, 'reject')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
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
