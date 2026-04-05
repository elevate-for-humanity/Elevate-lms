'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Database, Server, TrendingUp, Users, Zap, Download } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    database: { status: string; connected: boolean; latency?: number };
    redis: { status: string; connected: boolean; latency?: number };
    stripe: { status: string; configured: boolean };
    email: { status: string; configured: boolean };
  };
  metrics: {
    uptime: number;
    memory: { used: number; total: number };
    requests: { total: number; errors: number; rate: number };
    rateLimits: { blocked: number; allowed: number };
  };
}

interface RecentError {
  id: string;
  timestamp: string;
  endpoint: string;
  error: string;
  statusCode: number;
  ip: string;
}



export default function MonitoringDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [errors, setErrors] = useState<RecentError[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    fetchErrors();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStatus();
        fetchErrors();
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/status');
      const data = await response.json();
      setStatus(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setLoading(false);
    }
  };

  const fetchErrors = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/errors?limit=10');
      const data = await response.json();
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    }
  };

  const downloadBundle = async () => {
    setBundleLoading(true);
    setBundleError(null);
    try {
      const res = await fetch('/api/monitoring/bundle');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setBundleError(data.error || `Error ${res.status}`);
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `elevate-support-bundle-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setBundleError('Failed to download bundle. Check your connection and try again.');
    } finally {
      setBundleLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'text-brand-green-600 bg-brand-green-100';
      case 'degraded':
      case 'warn':
        return 'text-yellow-600 bg-yellow-100';
      case 'down':
      case 'fail':
        return 'text-brand-red-600 bg-brand-red-100';
      default:
        return 'text-black bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <span className="text-slate-400 flex-shrink-0">•</span>;
      case 'degraded':
      case 'warn':
        return <AlertCircle className="h-5 w-5" />;
      case 'down':
      case 'fail':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Monitoring" }]} />
        </div>
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-brand-blue-600 mx-auto mb-4" />
          <p className="text-black">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Monitoring" }]} />
        </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-black flex items-center gap-3">
                <Activity className="h-11 w-11 text-brand-blue-600" />
                System Monitoring
              </h1>
              <p className="text-black mt-2">Real-time platform health and performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-black">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh (10s)
              </label>
              <button
                onClick={() => {
                  fetchStatus();
                  fetchErrors();
                }}
                className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
              >
                Refresh Now
              </button>
              <button
                onClick={downloadBundle}
                disabled={bundleLoading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4" />
                {bundleLoading ? 'Generating...' : 'Download Support Bundle'}
              </button>
            </div>
          </div>
        </div>

        {/* Bundle error */}
        {bundleError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
            <span>{bundleError}</span>
            <button onClick={() => setBundleError(null)} className="text-red-400 hover:text-red-600 ml-4">✕</button>
          </div>
        )}

        {/* Overall Status */}
        {status && (
          <div className={`mb-8 p-6 rounded-xl border-2 ${
            status.overall === 'healthy' ? 'bg-brand-green-50 border-brand-green-200' :
            status.overall === 'degraded' ? 'bg-yellow-50 border-yellow-200' :
            'bg-brand-red-50 border-brand-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(status.overall)}
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    System Status: {status.overall.toUpperCase()}
                  </h2>
                  <p className="text-black">
                    Last updated: {new Date(status.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-black">Uptime</div>
                <div className="text-2xl font-bold text-black">
                  {formatUptime(status.metrics.uptime)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Status Grid */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Database */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Database className="h-11 w-11 text-brand-blue-600" />
                <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(status.checks.database.status)}`}>
                  {status.checks.database.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Database</h3>
              <div className="space-y-1 text-sm text-black">
                <div>Status: {status.checks.database.connected ? 'Connected' : 'Disconnected'}</div>
                {status.checks.database.latency && (
                  <div>Latency: {status.checks.database.latency}ms</div>
                )}
              </div>
            </div>

            {/* Redis */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="h-11 w-11 text-brand-orange-600" />
                <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(status.checks.redis.status)}`}>
                  {status.checks.redis.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Redis Cache</h3>
              <div className="space-y-1 text-sm text-black">
                <div>Status: {status.checks.redis.connected ? 'Connected' : 'Disconnected'}</div>
                {status.checks.redis.latency && (
                  <div>Latency: {status.checks.redis.latency}ms</div>
                )}
              </div>
            </div>

            {/* Stripe */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Server className="h-11 w-11 text-brand-blue-600" />
                <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(status.checks.stripe.status)}`}>
                  {status.checks.stripe.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Stripe</h3>
              <div className="space-y-1 text-sm text-black">
                <div>Status: {status.checks.stripe.configured ? 'Configured' : 'Not Configured'}</div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-11 w-11 text-brand-green-600" />
                <span className={`px-3 py-2 rounded-full text-sm font-medium ${getStatusColor(status.checks.email.status)}`}>
                  {status.checks.email.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-black mb-2">Email</h3>
              <div className="space-y-1 text-sm text-black">
                <div>Status: {status.checks.email.configured ? 'Configured' : 'Not Configured'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Request Metrics */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-10 w-10 text-brand-blue-600" />
                <h3 className="text-lg font-bold text-black">Requests</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-black">Total Requests</div>
                  <div className="text-2xl font-bold text-black">{status.metrics.requests.total.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-black">Error Rate</div>
                  <div className="text-2xl font-bold text-brand-red-600">
                    {((status.metrics.requests.errors / status.metrics.requests.total) * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-black">Requests/min</div>
                  <div className="text-2xl font-bold text-black">{status.metrics.requests.rate.toFixed(1)}</div>
                </div>
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-10 w-10 text-brand-orange-600" />
                <h3 className="text-lg font-bold text-black">Rate Limits</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-black">Blocked Requests</div>
                  <div className="text-2xl font-bold text-brand-red-600">{status.metrics.rateLimits.blocked.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-black">Allowed Requests</div>
                  <div className="text-2xl font-bold text-brand-green-600">{status.metrics.rateLimits.allowed.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-black">Block Rate</div>
                  <div className="text-2xl font-bold text-brand-orange-600">
                    {((status.metrics.rateLimits.blocked / (status.metrics.rateLimits.blocked + status.metrics.rateLimits.allowed)) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Server className="h-10 w-10 text-brand-blue-600" />
                <h3 className="text-lg font-bold text-black">Memory</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-black">Used</div>
                  <div className="text-2xl font-bold text-black">{status.metrics.memory.used} MB</div>
                </div>
                <div>
                  <div className="text-sm text-black">Total</div>
                  <div className="text-2xl font-bold text-black">{status.metrics.memory.total} MB</div>
                </div>
                <div>
                  <div className="text-sm text-black">Usage</div>
                  <div className="text-2xl font-bold text-brand-blue-600">
                    {((status.metrics.memory.used / status.metrics.memory.total) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Errors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-10 w-10 text-brand-red-600" />
            <h3 className="text-lg font-bold text-black">Recent Errors</h3>
            <span className="ml-auto text-sm text-black">Last 10 errors</span>
          </div>
          
          {errors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <p>No recent errors - system running smoothly!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-black">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-black">Endpoint</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-black">Error</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-black">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-black">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((error) => (
                    <tr key={error.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-black">
                        {new Date(error.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-black">{error.endpoint}</td>
                      <td className="py-3 px-4 text-sm text-black max-w-md truncate">{error.error}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-2 rounded text-xs font-medium ${
                          error.statusCode >= 500 ? 'bg-brand-red-100 text-brand-red-700' :
                          error.statusCode >= 400 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-black'
                        }`}>
                          {error.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-black">{error.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
