
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Key, Plus, Copy, Eye, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'API Keys | Admin | Elevate For Humanity',
  description: 'Manage API keys for integrations.',
};

const statusColors: Record<string, string> = {
  active: 'bg-brand-green-100 text-brand-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  revoked: 'bg-brand-red-100 text-brand-red-800',
};

export default async function AdminApiKeysPage() {
  const supabase = await createClient();

  // Fetch API keys from database
  let apiKeys: any[] | null = null;
  let error: any = null;
  let totalKeys = 0;
  let activeKeys = 0;

  try {
    const result = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });
    apiKeys = result.data;
    error = result.error;

    if (!error) {
      const { count: total } = await supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true });
      totalKeys = total || 0;

      const { count: active } = await supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      activeKeys = active || 0;
    }
  } catch (e) {
    error = { message: 'Table not found. Please run the migration.' };
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Api Keys" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-600 mt-1">Manage API keys for external integrations</p>
          </div>
          <button className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Generate New Key
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Keep your API keys secure</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Never share your API keys in public repositories or client-side code. 
                Rotate keys regularly and revoke any that may have been compromised.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Keys</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalKeys || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Keys</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{activeKeys || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500">Rate Limit</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">1,000/min</p>
            <p className="text-sm text-gray-500 mt-1">Default limit per key</p>
          </div>
        </div>

        {/* API Keys Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <div className="text-brand-red-600 mb-4">Database table not found</div>
              <p className="text-gray-600 mb-4">
                Run the migration in Supabase Dashboard SQL Editor:
              </p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                supabase/migrations/20260125_admin_tables.sql
              </code>
            </div>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="p-8 text-center">
              <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
              <p className="text-gray-500 mb-4">Generate your first API key to get started with integrations</p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
                <Plus className="w-5 h-5" />
                Generate New Key
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Key</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Created</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Last Used</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Key className="w-5 h-5 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-900">{apiKey.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {apiKey.key_prefix}****************************
                        </code>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Copy">
                          <Copy className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(apiKey.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {apiKey.last_used_at 
                        ? new Date(apiKey.last_used_at).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[apiKey.status] || 'bg-gray-100 text-gray-800'}`}>
                        {apiKey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg" title="View details">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-brand-red-50 rounded-lg" title="Revoke">
                          <Trash2 className="w-4 h-4 text-brand-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
