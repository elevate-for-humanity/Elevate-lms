import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, DollarSign, Layout, Lock, ArrowRight, Phone, Grid } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `My Apps | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Access your purchased apps and tools.',
  robots: { index: false, follow: false },
};

const APP_CATALOG = [
  { key: 'sam-gov',         name: 'SAM.gov Assistant',              description: 'Federal contractor registration and compliance management', icon: Building2, color: 'blue', href: '/apps/sam-gov' },
  { key: 'grants',          name: 'Grants Discovery & Management',  description: 'Find and manage federal, state, and foundation grants',     icon: DollarSign, color: 'green', href: '/apps/grants' },
  { key: 'website-builder', name: 'Website Builder',                description: 'Build professional training provider websites',             icon: Layout,    color: 'blue',  href: '/apps/website-builder' },
] as const;

const colors: Record<string, { bg: string; text: string }> = {
  blue:  { bg: 'bg-brand-blue-100',  text: 'text-brand-blue-600' },
  green: { bg: 'bg-brand-green-100', text: 'text-brand-green-600' },
};

export default async function AppsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apps');

  // Fetch user's active licenses
  const { data: licenses } = await supabase
    .from('user_licenses')
    .select('license_type, status, expires_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'trial']);

  const activeLicenseKeys = new Set((licenses ?? []).map((l) => l.license_type));

  const activeApps = APP_CATALOG.filter((a) => activeLicenseKeys.has(a.key));
  const lockedApps = APP_CATALOG.filter((a) => !activeLicenseKeys.has(a.key));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'My Apps' }]} />
        </div>
      </div>

      <div className="py-8 max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Apps</h1>
          <p className="text-slate-600 mt-1">Access your purchased apps and tools</p>
        </div>

        {/* Active / Trial Apps */}
        {activeApps.length > 0 ? (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Apps</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeApps.map((app) => {
                const c = colors[app.color] ?? colors.blue;
                const license = (licenses ?? []).find((l) => l.license_type === app.key);
                const isTrial = license?.status === 'trial';
                return (
                  <Link key={app.key} href={app.href} className="bg-white rounded-xl border p-6 hover:shadow-lg transition group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
                        <app.icon className={`w-6 h-6 ${c.text}`} />
                      </div>
                      {isTrial && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">Trial</span>}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1 group-hover:text-brand-blue-600 transition">{app.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{app.description}</p>
                    <div className="flex items-center text-brand-blue-600 text-sm font-medium">
                      Open App <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-10 bg-slate-50 rounded-xl p-8 text-center border">
            <Grid className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">No active apps yet.</p>
            <p className="text-slate-500 text-sm mt-1">Browse the store to add tools to your account.</p>
          </div>
        )}

        {/* Locked Apps */}
        {lockedApps.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Available to Unlock</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lockedApps.map((app) => {
                const c = colors[app.color] ?? colors.blue;
                return (
                  <div key={app.key} className="bg-white rounded-xl border p-6 opacity-60">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center`}>
                        <app.icon className={`w-6 h-6 ${c.text}`} />
                      </div>
                      <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{app.name}</h3>
                    <p className="text-slate-600 text-sm mb-4">{app.description}</p>
                    <Link href="/store/apps" className="text-brand-blue-600 text-sm font-medium hover:underline">
                      Get Access →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Browse Store */}
        <div className="bg-white rounded-xl border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Browse More Apps</h2>
            <p className="text-slate-600 text-sm">Discover more tools to grow your organization</p>
          </div>
          <Link href="/store/apps" className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 flex items-center gap-2">
            Visit Store <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <section className="bg-brand-blue-700 text-white py-12 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Start Your Career?</h2>
          <p className="text-white mb-6">Check your eligibility for funded career training programs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/start" className="inline-flex items-center justify-center bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-100 transition">Apply Now</Link>
            <Link href="/support" className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-blue-800 transition">
              <Phone className="w-4 h-4" /> Visit Support Center
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
