'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Clock,
  AlertCircle,
  ExternalLink,
  Download,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  FolderOpen,
} from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  filing_status: string;
  jotform_submission_id: string;
  sfc_return_id?: string;
  status: string;
  created_at: string;
}

interface TaxDocument {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_size: number;
  file_url: string;
  status: string;
  created_at: string;
  tax_year: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const DOC_TYPE_LABELS: Record<string, string> = {
  w2: 'W-2', '1099': '1099', photo_id: 'Photo ID',
  social_security_card: 'SS Card', prior_year_return: 'Prior Year',
  bank_info: 'Bank Info', other: 'Other',
};



export default function ClientIntakeDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'clients' | 'documents'>('clients');
  const [documents, setDocuments] = useState<TaxDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docSearch, setDocSearch] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments();
  }, [activeTab]);

  const fetchDocuments = async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('/api/supersonic-fast-cash/admin-documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      logger.error('Failed to fetch documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const markDocReviewed = async (docId: string) => {
    try {
      await fetch('/api/supersonic-fast-cash/admin-documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, status: 'reviewed' }),
      });
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'reviewed' } : d));
    } catch (err) {
      logger.error('Failed to mark reviewed:', err);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/supersonic-fast-cash/clients');
      const data = await response.json();
      setClients(data.clients || []);
    } catch (error) {
      logger.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncJotForm = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/supersonic-fast-cash/sync-jotform', {
        method: 'POST',
      });
      const data = await response.json();
      alert(`Synced ${data.count} new submissions`);
      fetchClients();
    } catch (error) {
      logger.error('Sync failed:', error);
      alert('Failed to sync JotForm submissions');
    } finally {
      setLoading(false);
    }
  };

  const openInSupersonicFastCash = (sfcReturnId: string) => {
    // In production, this would open SupersonicFastCash with the specific return
    window.open(`supersonic://return/${sfcReturnId}`, '_blank');
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-white py-8 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Client Intake" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Client Intake Dashboard</h1>
          <p className="text-black">Manage JotForm submissions and uploaded tax documents</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
          {([['clients', Users, 'Clients'], ['documents', FolderOpen, 'Documents']] as const).map(([tab, Icon, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-white shadow text-gray-900' : 'text-black hover:text-gray-700'}`}
            >
              <Icon className="w-4 h-4" />{label}
              {tab === 'documents' && documents.filter(d => d.status === 'pending_review').length > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
                  {documents.filter(d => d.status === 'pending_review').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
              <Search className="w-4 h-4 text-black" />
              <input
                type="text"
                placeholder="Search by file name or user ID…"
                value={docSearch}
                onChange={e => setDocSearch(e.target.value)}
                className="flex-1 text-sm focus:outline-none"
              />
              <button onClick={fetchDocuments} className="flex items-center gap-1 text-sm text-black hover:text-gray-700">
                <RefreshCw className={`w-4 h-4 ${docsLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Client', 'Document', 'Type', 'Year', 'Size', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-black uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {docsLoading ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-black">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading…
                    </td></tr>
                  ) : documents.filter(d =>
                    !docSearch || d.file_name.toLowerCase().includes(docSearch.toLowerCase()) || d.user_id.includes(docSearch)
                  ).length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-black">No documents uploaded yet</td></tr>
                  ) : (
                    documents
                      .filter(d => !docSearch || d.file_name.toLowerCase().includes(docSearch.toLowerCase()) || d.user_id.includes(docSearch))
                      .map(doc => (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-black">{doc.user_id.slice(0, 8)}…</td>
                          <td className="px-4 py-3 max-w-[180px] truncate font-medium">{doc.file_name}</td>
                          <td className="px-4 py-3">
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-black">{doc.tax_year}</td>
                          <td className="px-4 py-3 text-black">{formatBytes(doc.file_size)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.status === 'reviewed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {doc.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-xs">
                                <Download className="w-3 h-3" /> Download
                              </a>
                              {doc.status !== 'reviewed' && (
                                <button onClick={() => markDocReviewed(doc.id)}
                                  className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-xs">
                                  <CheckCircle className="w-3 h-3" /> Mark Reviewed
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && <>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">
                Total Clients
              </span>
              <Users className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div className="text-3xl font-bold">{clients.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">
                In Progress
              </span>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold">
              {clients.filter((c) => c.status === 'in_progress').length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">
                Completed
              </span>
              <span className="text-black flex-shrink-0">•</span>
            </div>
            <div className="text-3xl font-bold">
              {clients.filter((c) => c.status === 'completed').length}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">
                SupersonicFastCash Returns
              </span>
              <FileText className="w-5 h-5 text-brand-blue-600" />
            </div>
            <div className="text-3xl font-bold">
              {clients.filter((c) => c.sfc_return_id).length}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-green-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-brand-green-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={syncJotForm}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                />
                Sync JotForm
              </button>

              <button
                onClick={fetchClients}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Client List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Filing Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  SupersonicFastCash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-black" />
                      <span className="text-black">Loading clients...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-black">No clients found</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold">
                          {client.first_name} {client.last_name}
                        </div>
                        <div className="text-sm text-black">
                          ID: {client.id.slice(0, 8)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>{client.email}</div>
                        <div className="text-black">{client.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm capitalize">
                        {client.filing_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-2 rounded-full text-xs font-semibold ${
                          client.status === 'completed'
                            ? 'bg-brand-green-100 text-brand-green-700'
                            : client.status === 'review'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-brand-blue-100 text-brand-blue-700'
                        }`}
                      >
                        {client.status === 'completed' && (
                          <span className="text-black flex-shrink-0">•</span>
                        )}
                        {client.status === 'review' && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {client.status === 'in_progress' && (
                          <Clock className="w-3 h-3" />
                        )}
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {client.sfc_return_id ? (
                        <button
                          onClick={() => openInSupersonicFastCash(client.sfc_return_id!)}
                          className="flex items-center gap-1 text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                        >
                          <FileText className="w-4 h-4" />
                          Open
                        </button>
                      ) : (
                        <span className="text-sm text-black">
                          Not created
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <a
                          href={`/supersonic-fast-cash/admin/clients/${client.id}`}
                          className="text-sm text-brand-blue-600 hover:text-brand-blue-700 font-semibold"
                        >
                          View
                        </a>
                        <a
                          href={`https://www.jotform.com/submission/${client.jotform_submission_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-black hover:text-black font-semibold flex items-center gap-1"
                        >
                          JotForm
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-brand-blue-50 rounded-xl p-6">
          <h3 className="font-bold text-lg mb-4">Setup Instructions</h3>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">
                1. Configure JotForm Webhook
              </h4>
              <p className="text-black mb-2">
                Add this webhook URL to your JotForm:
              </p>
              <code className="block bg-white px-4 py-2 rounded border">
                https://www.elevateforhumanity.org/api/supersonic-fast-cash/jotform-webhook
              </code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                2. Set Environment Variables
              </h4>
              <pre className="bg-white px-4 py-2 rounded border text-xs">
                JOTFORM_API_KEY=your_api_key_here
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. Test Integration</h4>
              <p className="text-black">
                Submit a test form and verify it appears here and creates a
                SupersonicFastCash return.
              </p>
            </div>
          </div>
        </div>

        </> /* end clients tab */}

      </div>
    </div>
  );
}
