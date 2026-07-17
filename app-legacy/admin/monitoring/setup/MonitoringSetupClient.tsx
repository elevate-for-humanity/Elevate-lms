'use client';

import { useState } from 'react';
import { Activity, CheckCircle, AlertCircle, Settings, RefreshCw } from 'lucide-react';

interface Monitor {
  id: string;
  name: string;
  type: 'uptime' | 'performance' | 'error';
  endpoint: string;
  interval: number;
  status: 'active' | 'paused' | 'error';
  lastCheck?: string;
}

export default function MonitoringSetupClient() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMonitors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monitoring');
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
      }
    } catch (err) {
      console.error('Failed to fetch:', err);
    }
    setLoading(false);
  };

  const toggleMonitor = async (id: string) => {
    try {
      await fetch(`/api/admin/monitoring/${id}/toggle`, { method: 'POST' });
      setMonitors(monitors.map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'paused' : 'active' } : m));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" /> Active</span>;
      case 'paused': return <span className="flex items-center gap-1 text-gray-500">Paused</span>;
      case 'error': return <span className="flex items-center gap-1 text-red-600"><AlertCircle className="w-4 h-4" /> Error</span>;
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6" /> Monitoring Setup</h1>
        <button onClick={fetchMonitors} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Active Monitors</p>
          <p className="text-2xl font-bold text-green-600">{monitors.filter(m => m.status === 'active').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Paused</p>
          <p className="text-2xl font-bold text-gray-600">{monitors.filter(m => m.status === 'paused').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Errors</p>
          <p className="text-2xl font-bold text-red-600">{monitors.filter(m => m.status === 'error').length}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interval</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {monitors.map(monitor => (
              <tr key={monitor.id}>
                <td className="px-4 py-3 font-medium">{monitor.name}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{monitor.type}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-sm">{monitor.endpoint}</td>
                <td className="px-4 py-3 text-gray-600">{monitor.interval}s</td>
                <td className="px-4 py-3">{getStatusIcon(monitor.status)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleMonitor(monitor.id)} className="p-2 text-gray-600 hover:bg-gray-100 rounded">
                    <Settings className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
