'use client';

import { useState } from 'react';
import { FileText, CheckCircle, XCircle, Clock, Search, Download } from 'lucide-react';

interface Application {
  id: string;
  provider_name: string;
  provider_type: string;
  contact_email: string;
  submitted_date: string;
  status: 'pending' | 'approved' | 'rejected';
  documents_count: number;
  notes?: string;
}

export default function ApplicationQueue() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/provider-applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const reviewApplication = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/admin/provider-applications/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setApplications(applications.map(a => a.id === id ? { ...a, status: action === 'approve' ? 'approved' : 'rejected' } : a));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
    }
  };

  const filteredApps = applications.filter(a => 
    (filter === 'all' || a.status === filter) &&
    (a.provider_name.toLowerCase().includes(search.toLowerCase()) || a.contact_email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Provider Applications</h1>
        <button onClick={fetchApplications} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-4 py-2 border rounded-lg">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredApps.map(app => (
              <tr key={app.id}>
                <td className="px-4 py-3 font-medium">{app.provider_name}</td>
                <td className="px-4 py-3 text-gray-600">{app.provider_type}</td>
                <td className="px-4 py-3 text-gray-600">{app.contact_email}</td>
                <td className="px-4 py-3 text-gray-600">{app.documents_count}</td>
                <td className="px-4 py-3">{getStatusBadge(app.status)}</td>
                <td className="px-4 py-3 text-right">
                  {app.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => reviewApplication(app.id, 'approve')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => reviewApplication(app.id, 'reject')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle className="w-5 h-5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
