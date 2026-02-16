
'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import React from 'react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Plug, XCircle, Settings } from 'lucide-react';

export default function IntegrationsPage() {
  const supabase = createClient();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data }: any = await supabase
      .from('integrations')
      .select('*')
      .order('name');

    setIntegrations(data || []);
    setLoading(false);
  }

  async function toggleIntegration(id: string, currentStatus: boolean) {
    if (!supabase) return;
    await supabase
      .from('integrations')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    await loadData();
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const activeCount = integrations.filter((i) => i.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Integrations" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-[280px] md:h-[350px] lg:h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/alumni.jpg"
          alt="Integrations Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Integrations Management
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Manage third-party integrations and API connections
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/integrations/google-classroom"
              className="bg-brand-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Google Classroom
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <Plug className="h-11 w-11 text-brand-blue-600" />
              <p className="text-sm text-black">Total Integrations</p>
            </div>
            <p className="text-3xl font-bold text-brand-blue-600">
              {integrations.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <p className="text-sm text-black">Active</p>
            </div>
            <p className="text-3xl font-bold text-brand-green-600">
              {activeCount}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="h-11 w-11 text-black" />
              <p className="text-sm text-black">Inactive</p>
            </div>
            <p className="text-3xl font-bold text-black">
              {integrations.length - activeCount}
            </p>
          </div>
        </div>

        {/* Integrations List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-6">Available Integrations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-black mt-1">
                      {integration.description}
                    </p>
                  </div>
                  {integration.is_active ? (
                    <span className="text-slate-400 flex-shrink-0">•</span>
                  ) : (
                    <XCircle className="h-10 w-10 text-black" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      toggleIntegration(integration.id, integration.is_active)
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium ${
                      integration.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-brand-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {integration.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <Link
                    href={`/admin/integrations/${integration.slug}`}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-brand-blue-100 text-brand-blue-700 hover:bg-brand-blue-200 flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4" />
                    Configure
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Explore training programs and earn industry certifications through Elevate for
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
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
