'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Database, Server, Zap, Users } from 'lucide-react';
import Link from 'next/link';



export default function SystemMonitorPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">

      {/* Hero Image */}
        <Activity className="h-11 w-11 animate-spin text-brand-blue-600" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'System Monitor' }]} />
        <h1 className="text-3xl font-bold mb-8 mt-4 flex items-center gap-3">
          <Activity className="h-11 w-11 text-brand-blue-600" />
          System Monitor
        </h1>

        {/* Overall Status */}
        <div className={`mb-8 p-6 rounded-xl border-2 ${
          status?.status === 'healthy' ? 'bg-brand-green-50 border-brand-green-200' :
          status?.status === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
          'bg-brand-red-50 border-brand-red-200'
        }`}>
          <h2 className="text-2xl font-bold">
            Status: {status?.status?.toUpperCase() || 'UNKNOWN'}
          </h2>
          <p className="text-black">
            Last updated: {status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'N/A'}
          </p>
        </div>

        {/* Service Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Database */}
          <div className="bg-white rounded-xl border p-6">
            <Database className="h-11 w-11 text-brand-blue-600 mb-4" />
            <h3 className="font-bold mb-2">Database</h3>
            <div className="text-sm">
              <div>Status: {status?.checks?.database?.status || 'unknown'}</div>
              <div>Connected: {status?.checks?.database?.connected ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* System */}
          <div className="bg-white rounded-xl border p-6">
            <Server className="h-11 w-11 text-brand-blue-600 mb-4" />
            <h3 className="font-bold mb-2">System</h3>
            <div className="text-sm">
              <div>Status: {status?.checks?.system?.status || 'unknown'}</div>
              <div>Uptime: {status?.checks?.system?.uptime ? Math.floor(status.checks.system.uptime / 60) + 'm' : 'N/A'}</div>
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white rounded-xl border p-6">
            <Zap className="h-11 w-11 text-brand-orange-600 mb-4" />
            <h3 className="font-bold mb-2">Memory</h3>
            <div className="text-sm">
              <div>Used: {status?.checks?.system?.memory?.used || 0} MB</div>
              <div>Total: {status?.checks?.system?.memory?.total || 0} MB</div>
            </div>
          </div>

          {/* Environment */}
          <div className="bg-white rounded-xl border p-6">
            <Users className="h-11 w-11 text-brand-green-600 mb-4" />
            <h3 className="font-bold mb-2">Environment</h3>
            <div className="text-sm">
              <div>Status: {status?.checks?.environment?.status || 'unknown'}</div>
              <div>Env: {status?.environment || 'development'}</div>
            </div>
          </div>
        </div>

        {/* Production Ready Status */}
        {status?.production_ready && (
          <div className="bg-white rounded-xl border p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Production Readiness</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(status.production_ready).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-start gap-2">
                  {typeof value === 'string' && value.includes('•') ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium">{key.replace(/_/g, ' ')}</div>
                    <div className="text-black">{String(value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="bg-brand-blue-50 border-2 border-brand-blue-200 rounded-xl p-6">
          <h3 className="font-bold mb-4">Monitoring Pages</h3>
          <div className="space-y-2">
            <Link href="/admin/monitoring" className="block text-brand-blue-600 hover:underline">
              → Full Monitoring Dashboard
            </Link>
            <Link href="/admin/monitoring/setup" className="block text-brand-blue-600 hover:underline">
              → Monitoring Setup & Verification
            </Link>
            <Link href="/api/health" className="block text-brand-blue-600 hover:underline">
              → Health Check API
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
