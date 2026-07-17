'use client';

import { useState } from 'react';
import { FileText, Upload, CheckCircle, XCircle, Download, Search } from 'lucide-react';

interface Document {
  id: string;
  holder_name: string;
  document_type: string;
  file_name: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export default function ProgramHolderDocumentsClient() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/program-holder-documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
    setLoading(false);
  };

  const reviewDocument = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/admin/program-holder-documents/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setDocuments(documents.map(d => d.id === id ? { ...d, status: action === 'approve' ? 'approved' : 'rejected' } : d));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Pending</span>;
    }
  };

  const filtered = documents.filter(d => d.holder_name.toLowerCase().includes(search.toLowerCase()) || d.file_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Program Holder Documents</h1>
        <button onClick={fetchDocuments} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Refresh</button>
      </div>
      <div className="flex gap-4">
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg" />
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-4 py-2 border rounded-lg">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holder</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(doc => (
              <tr key={doc.id}>
                <td className="px-4 py-3 font-medium">{doc.holder_name}</td>
                <td className="px-4 py-3 text-gray-600">{doc.document_type}</td>
                <td className="px-4 py-3 text-gray-600 flex items-center gap-2"><FileText className="w-4 h-4" />{doc.file_name}</td>
                <td className="px-4 py-3">{getStatusBadge(doc.status)}</td>
                <td className="px-4 py-3 text-right">
                  {doc.status === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => reviewDocument(doc.id, 'approve')} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle className="w-5 h-5" /></button>
                      <button onClick={() => reviewDocument(doc.id, 'reject')} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle className="w-5 h-5" /></button>
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
