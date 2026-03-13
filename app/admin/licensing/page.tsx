
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface License {
  id: string;
  tenant_id: string;
  plan: string;
  status: string;
  expires_at: string | null;
  max_users: number | null;
  max_students: number | null;
  features: Record<string, boolean>;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export default function LicensingPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const [licensesRes, tenantsRes] = await Promise.all([
      supabase.from('licenses').select('*').order('created_at', { ascending: false }),
      supabase.from('tenants').select('id, name, slug, active').order('name')
    ]);

    if (licensesRes.data) setLicenses(licensesRes.data);
    if (tenantsRes.data) setTenants(tenantsRes.data);
    setLoading(false);
  }

  async function handleUpdateLicenseStatus(licenseId: string, status: string) {
    const { updateLicenseStatus: serverUpdate } = await import('./actions');
    await serverUpdate(licenseId, status);
    loadData();
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* Hero Image */}
      <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Licensing' }]} />
      <h1 className="text-3xl font-bold mb-8 mt-4">License Management</h1>

      <div className="grid gap-6">
        {licenses.map((license) => {
          const tenant = tenants.find(t => t.id === license.tenant_id);

          return (
            <div key={license.id} className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{tenant?.name || 'Unknown Tenant'}</h3>
                  <p className="text-sm text-black">{tenant?.slug}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                    license.status === 'active' ? 'bg-brand-green-100 text-brand-green-800' :
                    license.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                    license.status === 'expired' ? 'bg-brand-red-100 text-brand-red-800' :
                    'bg-gray-100 text-black'
                  }`}>
                    {license.status}
                  </span>
                  <span className="px-3 py-2 rounded-full text-sm font-medium bg-brand-blue-100 text-brand-blue-800">
                    {license.plan}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-black">Max Users</p>
                  <p className="text-lg font-semibold">{license.max_users || '∞'}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Max Students</p>
                  <p className="text-lg font-semibold">{license.max_students || '∞'}</p>
                </div>
                <div>
                  <p className="text-sm text-black">Expires</p>
                  <p className="text-lg font-semibold">
                    {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-black mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(license.features).map(([key, enabled]: any) => (
                    <span
                      key={key}
                      className={`px-2 py-2 rounded text-xs ${
                        enabled ? 'bg-brand-green-50 text-brand-green-700' : 'bg-gray-50 text-black'
                      }`}
                    >
                      {key.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {license.status === 'active' && (
                  <button
                    onClick={() => handleUpdateLicenseStatus(license.id, 'suspended')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    Suspend
                  </button>
                )}
                {license.status === 'suspended' && (
                  <button
                    onClick={() => handleUpdateLicenseStatus(license.id, 'active')}
                    className="px-4 py-2 bg-brand-green-600 text-white rounded hover:bg-brand-green-700"
                  >
                    Activate
                  </button>
                )}
                {license.status !== 'cancelled' && (
                  <button
                    onClick={() => handleUpdateLicenseStatus(license.id, 'cancelled')}
                    className="px-4 py-2 bg-brand-red-600 text-white rounded hover:bg-brand-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {licenses.length === 0 && (
        <div className="text-center py-12 text-black">
          No licenses found
        </div>
      )}
    </div>
  );
}
