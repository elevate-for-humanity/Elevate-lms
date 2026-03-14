import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin, BookOpen, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Provider Network | Elevate for Humanity',
  description: 'Vetted training organizations, workforce agencies, and employers operating on the Elevate workforce hub.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/network' },
};

export const revalidate = 300; // 5-minute ISR

export default async function NetworkPage() {
  const supabase = await createClient();

  // Fetch active partner_provider tenants with their org details
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug, created_at')
    .eq('type', 'partner_provider')
    .eq('status', 'active')
    .order('name');

  // For each tenant, get their org profile and program count from catalog index
  const tenantIds = (tenants ?? []).map(t => t.id);

  const [{ data: orgs }, { data: catalogCounts }] = await Promise.all([
    tenantIds.length > 0
      ? supabase
          .from('organizations')
          .select('tenant_id, name, tagline, logo_url, support_email, website, city, state, service_area_counties')
          .in('tenant_id', tenantIds)
      : Promise.resolve({ data: [] }),
    tenantIds.length > 0
      ? supabase
          .from('program_catalog_index')
          .select('tenant_id')
          .in('tenant_id', tenantIds)
      : Promise.resolve({ data: [] }),
  ]);

  const orgByTenant = Object.fromEntries((orgs ?? []).map(o => [o.tenant_id, o]));
  const programCountByTenant = (catalogCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.tenant_id] = (acc[row.tenant_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Network' }]} />
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Provider Network</h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Vetted training organizations, workforce agencies, and employers operating on the Elevate hub.
            Every provider is reviewed, approved, and held to outcome standards.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link
              href="/programs/catalog"
              className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              <BookOpen className="w-4 h-4" /> Browse Programs
            </Link>
            <Link
              href="/partners/apply"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-lg font-semibold hover:bg-slate-100 transition"
            >
              Apply to Join
            </Link>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-b border-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { label: 'Approval Required', desc: 'Every provider is reviewed before publishing programs.' },
              { label: 'Outcome Tracked', desc: 'Completion, credential, and placement rates are monitored.' },
              { label: 'Compliance Verified', desc: 'MOU, insurance, and licensing documents on file.' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-blue-600" />
                <div className="font-semibold text-slate-900 text-sm">{item.label}</div>
                <div className="text-slate-500 text-xs">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Provider grid */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          {(tenants ?? []).length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No providers listed yet.</p>
              <Link href="/partners/apply" className="mt-4 inline-block text-sm text-brand-blue-600 hover:underline">
                Apply to be the first →
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {(tenants ?? []).map(tenant => {
                const org = orgByTenant[tenant.id];
                const programCount = programCountByTenant[tenant.id] ?? 0;
                return (
                  <div key={tenant.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition group">
                    {/* Logo / placeholder */}
                    <div className="h-28 bg-slate-50 flex items-center justify-center border-b border-slate-100">
                      {org?.logo_url ? (
                        <Image
                          src={org.logo_url}
                          alt={`${tenant.name} logo`}
                          width={120}
                          height={60}
                          className="object-contain max-h-16"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-brand-blue-50 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-brand-blue-400" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h2 className="font-bold text-slate-900 text-sm group-hover:text-brand-blue-700 transition">
                        {tenant.name}
                      </h2>
                      {org?.tagline && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{org.tagline}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                        {(org?.city || org?.state) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[org.city, org.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {programCount > 0 && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {programCount} program{programCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/programs/catalog?provider=${tenant.slug}`}
                          className="flex-1 text-center text-xs font-semibold bg-brand-blue-50 text-brand-blue-700 px-3 py-1.5 rounded-lg hover:bg-brand-blue-100 transition"
                        >
                          View Programs
                        </Link>
                        {org?.website && (
                          <a
                            href={org.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                          >
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 border-t border-slate-100 py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Join the Network</h2>
          <p className="text-slate-600 mb-6">
            Training organizations, workforce agencies, and employers can apply to operate on the Elevate hub.
            Approval is required. Admission is controlled.
          </p>
          <Link
            href="/partners/apply"
            className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-7 py-3.5 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
          >
            Apply to Join
          </Link>
        </div>
      </section>
    </div>
  );
}
