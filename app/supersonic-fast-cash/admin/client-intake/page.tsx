'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Download,
  RefreshCw,
  Search,
  Filter,
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



export default function ClientIntakeDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchClients();
  }, []);

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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Client Intake" }]} />
      </div>
<div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Client Intake Dashboard</h1>
          <p className="text-black">
            Manage JotForm submissions and SupersonicFastCash integration
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">
                Total Clients
              </span>
              <Users className="w-5 h-5 text-blue-600" />
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
              <CheckCircle className="w-5 h-5 text-green-600" />
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
              <FileText className="w-5 h-5 text-blue-600" />
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
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>

              <button
                onClick={syncJotForm}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
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
                            ? 'bg-green-100 text-green-700'
                            : client.status === 'review'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {client.status === 'completed' && (
                          <CheckCircle className="w-3 h-3" />
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
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-semibold"
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
                          className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
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
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
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
      </div>
    </div>
  );
}
