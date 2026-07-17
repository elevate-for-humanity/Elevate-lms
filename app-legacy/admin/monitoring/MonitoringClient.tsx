'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface SchemaCheck {
  tableExists: boolean;
  requiredColumns: Record<string, boolean>;
  canInsert: boolean;
  canQuery: boolean;
}

interface SchemaStatus {
  status: 'ready' | 'needs_setup' | 'error';
  checks: SchemaCheck;
  message: string;
  recommendations: string[];
}

interface ErrorEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  error: string;
  statusCode: number;
  ip: string;
}

export default function MonitoringClient() {
  const [schema, setSchema] = useState<SchemaStatus | null>(null);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [schemaRes, errorsRes] = await Promise.allSettled([
      fetch('/api/admin/monitoring/verify-schema').then(r => r.json()),
      fetch('/api/admin/monitoring/errors?limit=10').then(r => r.json()),
    ]);
    if (schemaRes.status === 'fulfilled') setSchema(schemaRes.value);
    if (errorsRes.status === 'fulfilled') setErrors(errorsRes.value.errors ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      {/* Schema health */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Audit Log Schema Health</h2>
          <button onClick={load} className="p-1.5 rounded hover:bg-slate-100 text-slate-400">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking…
          </div>
        ) : !schema ? (
          <p className="text-sm text-slate-400">Could not load schema status</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {schema.status === 'ready'
                ? <CheckCircle className="w-5 h-5 text-green-500" />
                : <AlertTriangle className="w-5 h-5 text-amber-500" />}
              <span className={`text-sm font-medium ${schema.status === 'ready' ? 'text-green-700' : 'text-amber-700'}`}>
                {schema.message}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Table exists', ok: schema.checks.tableExists },
                { label: 'Can query', ok: schema.checks.canQuery },
                { label: 'Can insert', ok: schema.checks.canInsert },
                { label: 'All columns', ok: Object.values(schema.checks.requiredColumns ?? {}).every(Boolean) },
              ].map(c => (
                <div key={c.label} className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg ${c.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {c.ok ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {c.label}
                </div>
              ))}
            </div>
            {schema.recommendations.length > 0 && (
              <ul className="text-xs text-amber-700 bg-amber-50 rounded-lg px-4 py-3 space-y-1">
                {schema.recommendations.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Recent errors */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent API Errors</h2>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm px-5 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-7 h-7 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No recent errors</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Time', 'Endpoint', 'Error', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {errors.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-xs truncate">{e.endpoint}</td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-sm truncate">{e.error}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      e.statusCode >= 500 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{e.statusCode}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
