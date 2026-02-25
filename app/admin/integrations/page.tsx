
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

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Integrations" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/technology/hero-program-it-support.jpg"
          alt="Integrations Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

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
                        ? 'bg-brand-red-100 text-brand-red-700 hover:bg-brand-red-200'
                        : 'bg-brand-green-100 text-brand-green-700 hover:bg-brand-green-200'
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
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Platform Integrations
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Connect with Stripe, Google Classroom, LTI providers, and more.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/integrations"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                View Integrations
              </Link>
              <Link
                href="/admin/system-health"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                System Health
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
