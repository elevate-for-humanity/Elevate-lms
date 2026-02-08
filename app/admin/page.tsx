import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Users, Settings, BarChart3, Database, Lock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Admin Portal | Elevate For Humanity',
  description: 'System administration, user management, and platform configuration.',
};

export default function AdminPortalLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin' }]} />
        </div>
      </div>

      <section className="bg-slate-800 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-10 h-10" />
            <span className="text-slate-300 font-medium">Admin Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Administration Portal</h1>
          <p className="text-xl text-slate-300 max-w-2xl mb-8">
            System administration, user management, and platform configuration for authorized administrators.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/login?redirect=/admin/dashboard" className="px-8 py-4 bg-white text-slate-800 font-bold rounded-lg hover:bg-slate-100">
              Admin Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Avatar Guide */}

      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Admin Capabilities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">User Management</h3>
              <p className="text-slate-600">Manage users, roles, and permissions across the platform.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">System Settings</h3>
              <p className="text-slate-600">Configure platform settings and preferences.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analytics</h3>
              <p className="text-slate-600">View platform-wide analytics and reports.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Data Management</h3>
              <p className="text-slate-600">Manage platform data and records.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Security</h3>
              <p className="text-slate-600">Monitor security and access controls.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Compliance</h3>
              <p className="text-slate-600">Ensure platform compliance and governance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <Lock className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Restricted Access</h3>
            <p className="text-slate-600">Admin portal access is restricted to authorized administrators only.</p>
          </div>
          <Link href="/login?redirect=/admin/dashboard" className="px-8 py-4 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900">
            Admin Sign In
          </Link>
        </div>
      </section>
    </div>
  );
}
