'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, Settings, Users, Database, Zap, AlertTriangle } from 'lucide-react';

interface SyncStatus {
  contacts: number;
  leads: number;
  lastSync: string | null;
  connected: boolean;
}

export default function SalesforceIntegrationPage() {
  const [status, setStatus] = useState<SyncStatus>({ contacts: 0, leads: 0, lastSync: null, connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations?provider=salesforce');
      if (res.ok) {
        const data = await res.json();
        setStatus({
          contacts: data.contacts ?? 0,
          leads: data.leads ?? 0,
          lastSync: data.last_sync ?? null,
          connected: data.connected ?? false,
        });
      }
    } catch {
      // API may not exist yet — show disconnected state
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    try {
      await fetch('/api/admin/integrations?provider=salesforce', { method: 'POST' });
      await checkStatus();
    } catch {
      // handle error
    } finally {
      setSyncing(false);
    }
  }

  const configFields = [
    { label: 'Salesforce Instance URL', placeholder: 'https://yourorg.my.salesforce.com', type: 'url' },
    { label: 'Client ID', placeholder: 'Connected App Consumer Key', type: 'text' },
    { label: 'Client Secret', placeholder: '••••••••', type: 'password' },
    { label: 'Callback URL', placeholder: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/integrations/salesforce/callback`, type: 'text' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Integrations', href: '/admin/integrations' },
            { label: 'Salesforce' },
          ]} />
        </div>

        <Link href="/admin/integrations" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Integrations
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-brand-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Salesforce Integration</h1>
            <p className="text-sm text-gray-500">Sync contacts, leads, and enrollment data with Salesforce CRM</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-400" /> Connection Status
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" /> Checking connection...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                {status.connected ? (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-green-100 text-brand-green-700 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    <XCircle className="w-3 h-3" /> Not Connected
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Synced Contacts</span>
                <span className="text-sm font-medium text-gray-900">{status.contacts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Synced Leads</span>
                <span className="text-sm font-medium text-gray-900">{status.leads}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Sync</span>
                <span className="text-sm text-gray-500">{status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}</span>
              </div>
              {status.connected && (
                <button
                  onClick={triggerSync}
                  disabled={syncing}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" /> Configuration
          </h2>
          <div className="space-y-4">
            {configFields.map((field) => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type={field.type}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                Store credentials securely. Use environment variables for production deployments. Never commit secrets to source control.
              </p>
            </div>
            <button className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              Save Configuration
            </button>
          </div>
        </div>

        {/* Sync Mapping */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" /> Field Mapping
          </h2>
          <div className="space-y-3">
            {[
              { local: 'profiles.full_name', remote: 'Contact.Name' },
              { local: 'profiles.email', remote: 'Contact.Email' },
              { local: 'profiles.phone', remote: 'Contact.Phone' },
              { local: 'enrollments.status', remote: 'Opportunity.Stage' },
              { local: 'programs.name', remote: 'Campaign.Name' },
            ].map((m) => (
              <div key={m.local} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-mono text-gray-600 flex-1">{m.local}</span>
                <span className="text-xs text-gray-400">→</span>
                <span className="text-xs font-mono text-brand-blue-600 flex-1">{m.remote}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
