'use client';

import { useState } from 'react';
import { Rocket, RefreshCw, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

interface Deployment {
  id: string;
  type: 'marketing' | 'admin' | 'lms';
  environment: 'production' | 'staging';
  status: 'pending' | 'deployed' | 'failed' | 'rolled_back';
  version: string;
  deployed_at?: string;
  url?: string;
  build_id: string;
}

export default function DeploymentsClient() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/deployments');
      if (res.ok) {
        const data = await res.json();
        setDeployments(data.deployments || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const rollback = async (id: string) => {
    if (!confirm('Rollback this deployment?')) return;
    try {
      await fetch(`/api/admin/studio/deployments/${id}/rollback`, { method: 'POST' });
      fetchDeployments();
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'rolled_back': return <RefreshCw className="w-5 h-5 text-amber-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Rocket className="w-6 h-6" /> Deployments</h1>
        <button onClick={fetchDeployments} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Deployments</p>
          <p className="text-2xl font-bold">{deployments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Deployed</p>
          <p className="text-2xl font-bold text-green-600">{deployments.filter(d => d.status === 'deployed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{deployments.filter(d => d.status === 'failed').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-gray-600">{deployments.filter(d => d.status === 'pending').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Environment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deployed</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {deployments.map(dep => (
              <tr key={dep.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{getStatusIcon(dep.status)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded capitalize ${
                    dep.type === 'marketing' ? 'bg-blue-100 text-blue-800' :
                    dep.type === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>{dep.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded ${
                    dep.environment === 'production' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>{dep.environment}</span>
                </td>
                <td className="px-4 py-3 font-mono">{dep.version}</td>
                <td className="px-4 py-3 text-gray-600">{dep.deployed_at || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {dep.url && (
                      <a href={dep.url} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    {dep.status === 'deployed' && (
                      <button onClick={() => rollback(dep.id)} className="p-1 text-amber-600 hover:bg-amber-50 rounded">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
