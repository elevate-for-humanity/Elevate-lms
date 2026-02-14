
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

import {
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function ExternalModulesPage() {
  const supabase = createClient();
  const [modules, setModules] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    // Load external modules
    let query = supabase
      .from('external_modules')
      .select(
        `
        *,
        provider:training_providers(name),
        enrollments:external_module_enrollments(count)
      `
      )
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data: modulesData } = await query;
    setModules(modulesData || []);

    // Load pending approvals
    const { data: pendingData } = await supabase
      .from('external_modules')
      .select(
        `
        *,
        provider:training_providers(name)
      `
      )
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    setPendingApprovals(pendingData || []);
    setLoading(false);
  }

  async function approveModule(moduleId: string) {
    const { error } = await supabase
      .from('external_modules')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', moduleId);

    if (!error) {
      await loadData();
    }
  }

  async function rejectModule(moduleId: string) {
    const { error } = await supabase
      .from('external_modules')
      .update({
        approval_status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq('id', moduleId);

    if (!error) {
      await loadData();
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "External Modules" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/homepage/student-portal-interface.png"
          alt="External Modules Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            External Modules Management
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Manage external training modules and partner integrations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/external-modules/approvals"
              className="bg-brand-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Pending Approvals ({pendingApprovals.length})
            </Link>
            <Link
              href="/admin/dashboard"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-black mb-2">Total Modules</p>
            <p className="text-3xl font-bold text-brand-blue-600">
              {modules.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-black mb-2">Active</p>
            <p className="text-3xl font-bold text-brand-green-600">
              {modules.filter((m) => m.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-black mb-2">Pending Approval</p>
            <p className="text-3xl font-bold text-brand-orange-600">
              {pendingApprovals.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm text-black mb-2">Inactive</p>
            <p className="text-3xl font-bold text-black">
              {modules.filter((m) => m.status === 'inactive').length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex gap-4 p-4 border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-brand-blue-600 text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              All Modules
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'active'
                  ? 'bg-brand-green-600 text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'pending'
                  ? 'bg-brand-orange-600 text-white'
                  : 'bg-gray-100 text-black'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {pendingApprovals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-10 w-10 text-brand-orange-600" />
              Pending Approvals
            </h2>
            <div className="space-y-4">
              {pendingApprovals.map((module) => (
                <div
                  key={module.id}
                  className="p-4 border rounded-lg bg-orange-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{module.name}</h3>
                      <p className="text-sm text-black">
                        Provider: {module.provider?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-black">
                        Submitted:{' '}
                        {new Date(module.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveModule(module.id)}
                        className="bg-brand-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectModule(module.id)}
                        className="bg-brand-orange-600 hover:bg-brand-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modules List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-4">External Modules</h2>
          {modules && modules.length > 0 ? (
            <div className="space-y-4">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {module.name}
                        <ExternalLink className="h-4 w-4 text-black" />
                      </h3>
                      <p className="text-sm text-black">
                        Provider: {module.provider?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-black">
                        Created:{' '}
                        {new Date(module.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {module.status === 'active' && (
                        <span className="flex items-center gap-1 text-brand-green-600 text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      )}
                      {module.approval_status === 'pending' && (
                        <span className="flex items-center gap-1 text-brand-orange-600 text-sm font-medium">
                          <Clock className="h-4 w-4" />
                          Pending
                        </span>
                      )}
                      {module.status === 'inactive' && (
                        <span className="flex items-center gap-1 text-black text-sm font-medium">
                          <XCircle className="h-4 w-4" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-black text-center py-8">
              No external modules found
            </p>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-blue-100 mb-8">
              Join thousands who have launched successful careers through our
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
