'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Database } from 'lucide-react';
import Link from 'next/link';

interface SchemaCheck {
  status: 'ready' | 'needs_setup' | 'error';
  checks: {
    tableExists: boolean;
    requiredColumns: Record<string, boolean>;
    canInsert: boolean;
    canQuery: boolean;
  };
  message: string;
  recommendations?: string[];
}



export default function MonitoringSetupPage() {
  const [checking, setChecking] = useState(true);
  const [result, setResult] = useState<SchemaCheck | null>(null);

  useEffect(() => {
    checkSchema();
  }, []);

  const checkSchema = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/monitoring/verify-schema');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to check schema:', error);
      setResult({
        status: 'error',
        checks: {
          tableExists: false,
          requiredColumns: {},
          canInsert: false,
          canQuery: false,
        },
        message: 'Failed to verify schema',
      });
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-blue-600 mx-auto mb-4" />
          <p className="text-black">Verifying monitoring setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Hero Image */}
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Setup" }]} />
      </div>
<div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black flex items-center gap-3">
            <Database className="h-11 w-11 text-brand-blue-600" />
            Monitoring Setup
          </h1>
          <p className="text-black mt-2">Verify and configure monitoring system</p>
        </div>

        {/* Status Card */}
        {result && (
          <div className={`mb-8 p-6 rounded-xl border-2 ${
            result.status === 'ready' ? 'bg-brand-green-50 border-brand-green-200' :
            result.status === 'needs_setup' ? 'bg-yellow-50 border-yellow-200' :
            'bg-brand-red-50 border-brand-red-200'
          }`}>
            <div className="flex items-center gap-4 mb-4">
              {result.status === 'ready' ? (
                <span className="text-slate-400 flex-shrink-0">•</span>
              ) : (
                <AlertCircle className="h-11 w-11 text-yellow-600" />
              )}
              <div>
                <h2 className="text-2xl font-bold text-black">
                  {result.status === 'ready' ? '• Ready' : '⚠️ Setup Required'}
                </h2>
                <p className="text-black">{result.message}</p>
              </div>
            </div>

            {result.status === 'ready' && (
              <div className="mt-6">
                <Link
                  href="/admin/monitoring"
                  className="inline-block px-6 py-3 bg-brand-green-600 text-white rounded-lg font-bold hover:bg-brand-green-700 transition-colors"
                >
                  Go to Monitoring Dashboard →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Checks Grid */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Table Exists */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-black">Table Exists</h3>
                {result.checks.tableExists ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertCircle className="h-5 w-5 text-brand-red-600" />
                )}
              </div>
              <p className="text-sm text-black">
                {result.checks.tableExists 
                  ? 'audit_logs table exists' 
                  : 'audit_logs table not found'}
              </p>
            </div>

            {/* Can Query */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-black">Can Query</h3>
                {result.checks.canQuery ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertCircle className="h-5 w-5 text-brand-red-600" />
                )}
              </div>
              <p className="text-sm text-black">
                {result.checks.canQuery 
                  ? 'SELECT permission granted' 
                  : 'Cannot query audit_logs'}
              </p>
            </div>

            {/* Can Insert */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-black">Can Insert</h3>
                {result.checks.canInsert ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertCircle className="h-5 w-5 text-brand-red-600" />
                )}
              </div>
              <p className="text-sm text-black">
                {result.checks.canInsert 
                  ? 'INSERT permission granted' 
                  : 'Cannot insert into audit_logs'}
              </p>
            </div>

            {/* Required Columns */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-black">Required Columns</h3>
                {Object.values(result.checks.requiredColumns).every(v => v) ? (
                  <span className="text-slate-400 flex-shrink-0">•</span>
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                {Object.entries(result.checks.requiredColumns).map(([col, exists]) => (
                  <div key={col} className="flex items-center gap-2">
                    {exists ? (
                      <span className="text-slate-400 flex-shrink-0">•</span>
                    ) : (
                      <AlertCircle className="h-3 w-3 text-brand-red-600" />
                    )}
                    <span className={exists ? 'text-black' : 'text-brand-red-600'}>
                      {col}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result && result.recommendations && result.recommendations.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h3 className="font-bold text-black mb-4">Setup Instructions</h3>
            <div className="space-y-3">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-brand-blue-100 rounded-full flex items-center justify-center text-brand-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="text-black">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SQL Script */}
        {result && result.status !== 'ready' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-black mb-4">Run This SQL in Supabase</h3>
            <p className="text-sm text-black mb-4">
              Go to Supabase Dashboard → SQL Editor → New Query → Paste and run:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`-- Add missing columns to audit_logs table
DO $$ 
BEGIN
    -- Add action_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'action_type'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN action_type TEXT;
    END IF;

    -- Add description if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'description'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN description TEXT;
    END IF;

    -- Add user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN user_id UUID REFERENCES profiles(id);
    END IF;

    -- Add ip_address if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN ip_address TEXT;
    END IF;

    -- Add details if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN details JSONB;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);`}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(document.querySelector('pre')?.textContent || '');
                alert('SQL copied to clipboard!');
              }}
              className="mt-4 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Copy SQL to Clipboard
            </button>
          </div>
        )}

        {/* Recheck Button */}
        <div className="mt-8 text-center">
          <button
            onClick={checkSchema}
            disabled={checking}
            className="px-6 py-3 bg-gray-200 text-black rounded-lg font-bold hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Re-check Setup'}
          </button>
        </div>
      </div>
    </div>
  );
}
