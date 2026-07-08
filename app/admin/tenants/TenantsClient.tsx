'use client';

import { useState } from 'react';
import { Building2, Plus, Settings, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  status: 'active' | 'suspended' | 'pending';
  plan: 'basic' | 'professional' | 'enterprise';
  users_count: number;
  created_at: string;
}

export default function TenantsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Failed:', err);
    }
    setLoading(false);
  };

  const toggleTenant = async (id: string) => {
    try {
      await fetch(`/api/admin/tenants/${id}/toggle`, { method: 'POST' });
      setTenants(tenants.map(t => t.id === id ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' } : t));
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Active</span>;
      case 'suspended': return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Suspended</span>;
      case 'pending': return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Pending</span>;
      default: return status;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise': return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Enterprise</span>;
      case 'professional': return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Professional</span>;
      case 'basic': return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Basic</span>;
      default: return plan;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Tenants</h1>
        <div className="flex gap-2">
          <button onClick={fetchTenants} disabled={loading} className="px-4 py-2 bg-slate-100 rounded-lg flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Tenants</p>
          <p className="text-2xl font-bold">{tenants.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{tenants.filter(t => t.status === 'active').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Enterprise</p>
          <p className="text-2xl font-bold text-purple-600">{tenants.filter(t => t.plan === 'enterprise').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold">{tenants.reduce((acc, t) => acc + t.users_count, 0)}</p>
        </div>
      </div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Users</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-gray-500">/{tenant.slug}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{tenant.domain || '-'}</td>
                <td className="px-4 py-3">{getPlanBadge(tenant.plan)}</td>
                <td className="px-4 py-3 text-gray-600">{tenant.users_count}</td>
                <td className="px-4 py-3">{getStatusBadge(tenant.status)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => toggleTenant(tenant.id)} className="p-1 text-gray-400 hover:text-blue-600">
                      {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600"><Settings className="w-4 h-4" /></button>
                    <button className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
