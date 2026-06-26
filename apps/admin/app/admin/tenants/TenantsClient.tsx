'use client';

import { useState } from 'react';
import { Plus, Building2, CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface Tenant {
  id: string;
  name: string | null;
  domain: string | null;
  status: string | null;
  created_at: string;
}

interface ProvisionForm {
  organizationName: string;
  contactName: string;
  contactEmail: string;
  licenseType: string;
  subdomain: string;
}

const EMPTY_FORM: ProvisionForm = {
  organizationName: '',
  contactName: '',
  contactEmail: '',
  licenseType: 'standard',
  subdomain: '',
};

export default function TenantsClient({
  initialTenants,
  totalCount,
}: {
  initialTenants: Tenant[];
  totalCount: number;
}) {
  const [tenants, setTenants] = useState(initialTenants);
  const [count, setCount] = useState(totalCount);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ProvisionForm>(EMPTY_FORM);
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (field: keyof ProvisionForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organizationName || !form.contactEmail || !form.contactName) {
      setError('Organization name, contact name, and email are required.');
      return;
    }
    setProvisioning(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding/provision-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: form.organizationName,
          contactName: form.contactName,
          contactEmail: form.contactEmail,
          licenseType: form.licenseType,
          subdomain: form.subdomain || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Provisioning failed');

      setSuccess(`Tenant "${form.organizationName}" provisioned. Welcome email sent to ${form.contactEmail}.`);
      setForm(EMPTY_FORM);
      setShowModal(false);
      // Optimistically add to list
      setTenants((prev) => [
        {
          id: data.tenantId ?? crypto.randomUUID(),
          name: form.organizationName,
          domain: form.subdomain ? `${form.subdomain}.${PLATFORM_DEFAULTS.canonicalDomain}` : null,
          status: 'active',
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCount((c) => c + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Provisioning failed');
    } finally {
      setProvisioning(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tenant Management</h1>
          <p className="text-slate-500 mt-1">{count} organization{count !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Tenant
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4 text-green-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {tenants.length > 0 ? (
            tenants.map((tenant) => (
              <div key={tenant.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-brand-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tenant.name ?? '—'}</p>
                    <p className="text-sm text-slate-500">{tenant.domain ?? 'No domain'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tenant.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tenant.status ?? 'active'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No tenants configured</p>
              <p className="text-slate-400 text-sm mt-1">Click &quot;Add Tenant&quot; to provision a new organization.</p>
            </div>
          )}
        </div>
      </div>

      {/* Provision Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Provision New Tenant</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProvision} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.organizationName}
                  onChange={(e) => update('organizationName', e.target.value)}
                  placeholder="e.g. ABC Barbershop Academy"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => update('contactName', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => update('contactEmail', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">License Type</label>
                  <select
                    value={form.licenseType}
                    onChange={(e) => update('licenseType', e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  >
                    <option value="standard">Standard</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="partner">Partner</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain</label>
                  <input
                    type="text"
                    value={form.subdomain}
                    onChange={(e) => update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. abc-barbershop"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <XCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={provisioning}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition"
                >
                  {provisioning ? <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning…</> : 'Provision Tenant'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 text-slate-600 hover:text-slate-800 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-slate-400">
                This creates a Supabase auth user, tenant record, and sends a welcome + setup guide email.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
