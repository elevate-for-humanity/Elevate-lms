'use client';

import { useState } from 'react';
import { Build as BuildIcon, Play, RefreshCw, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

interface Build {
  id: string;
  name: string;
  type: 'marketing' | 'admin' | 'lms';
  status: 'pending' | 'running' | 'success' | 'failed';
  started_at?: string;
  completed_at?: string;
  duration?: number;
  error?: string;
  commit_sha: string;
}

export default function BuildsClient() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBuilds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/studio/builds');
      if (res.ok) {
        const data = await res.json();
        setBuilds(data.builds || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const triggerBuild = async (type: string) => {
    try {
      await fetch('/api/admin/studio/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      fetchBuilds();
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BuildIcon className="w-6 h-6" /> Build History</h1>
        <button onClick={fetchBuilds} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => triggerBuild('marketing')} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <Play className="w-4 h-4" /> Build Marketing
        </button>
        <button onClick={() => triggerBuild('admin')} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2">
          <Play className="w-4 h-4" /> Build Admin
        </button>
        <button onClick={() => triggerBuild('lms')} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
          <Play className="w-4 h-4" /> Build LMS
        </button>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Build</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {builds.map(build => (
              <tr key={build.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{getStatusIcon(build.status)}</td>
                <td className="px-4 py-3 font-medium">{build.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded capitalize ${
                    build.type === 'marketing' ? 'bg-blue-100 text-blue-800' :
                    build.type === 'admin' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>{build.type}</span>
                </td>
                <td className="px-4 py-3 font-mono text-sm">{build.commit_sha?.slice(0, 7)}</td>
                <td className="px-4 py-3 text-gray-600">{build.started_at || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{build.duration ? `${build.duration}s` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
