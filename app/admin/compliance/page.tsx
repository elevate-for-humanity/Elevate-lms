import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import WIOAComplianceDashboard from '@/components/admin/WIOAComplianceDashboard';
import ComplianceClientShell from './ComplianceClientShell';
import {

  getAllGuardrails,
  getCriticalGuardrails,
  shouldAutoEnforce,
  type GuardrailPolicy,
} from '@/lib/compliance/guardrails';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/compliance',
  },
  title: 'Compliance Dashboard | Admin | Elevate For Humanity',
  description:
    'Monitor and manage GDPR, CCPA, and regulatory compliance. Track data requests, audit logs, and privacy compliance metrics.',
};

export default async function CompliancePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const { data: items, count: totalItems } = await supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(50);

  const { count: activeItems } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Compliance' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/admin-compliance-detail.jpg"
          alt="Compliance"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Total Items
                </h3>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalItems || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Active
                </h3>
                <p className="text-3xl font-bold text-brand-green-600">
                  {activeItems || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-black mb-2">
                  Recent
                </h3>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {items?.filter((i) => {
                    const created = new Date(i.created_at);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return created > weekAgo;
                  }).length || 0}
                </p>
              </div>
            </div>

            {/* Data Display */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold mb-4">Items</h2>
              {items && items.length > 0 ? (
                <div className="space-y-4">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <p className="font-semibold">
                        {item.title || item.name || item.id}
                      </p>
                      <p className="text-sm text-black">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black text-center py-8">No items found</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Compliance Dashboard
                        </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Monitor FERPA, WIOA, and DOL compliance across all programs.
                        </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/admin/compliance"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Run Audit
              </Link>
              <Link
                href="/admin/ferpa"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                View FERPA Log
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Automated Guardrails */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Automated Compliance Guardrails</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {(['critical', 'major', 'minor'] as const).map((severity) => {
              const all = getAllGuardrails();
              const filtered = all.filter((g) => g.severity === severity);
              const autoCount = filtered.filter(shouldAutoEnforce).length;
              const colors = {
                critical: 'border-brand-red-500 bg-brand-red-50',
                major: 'border-amber-500 bg-amber-50',
                minor: 'border-brand-blue-500 bg-brand-blue-50',
              };
              return (
                <div key={severity} className={`rounded-xl border-l-4 p-5 ${colors[severity]}`}>
                  <h3 className="font-bold capitalize text-gray-900">{severity} Guardrails</h3>
                  <p className="text-3xl font-bold mt-2">{filtered.length}</p>
                  <p className="text-sm text-gray-600 mt-1">{autoCount} auto-enforced</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold">Active Policies</h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Policy</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Severity</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Auto-Enforce</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Action</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">MOU Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {getAllGuardrails().map((g: GuardrailPolicy) => (
                  <tr key={g.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="font-medium text-sm">{g.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 capitalize">{g.violationType.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        g.severity === 'critical' ? 'bg-brand-red-100 text-brand-red-700' :
                        g.severity === 'major' ? 'bg-amber-100 text-amber-700' :
                        'bg-brand-blue-100 text-brand-blue-700'
                      }`}>{g.severity}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {shouldAutoEnforce(g) ? (
                        <span className="text-brand-green-600 text-sm font-medium">Yes</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Manual</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700 capitalize">{g.enforcementAction.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-3 text-xs text-gray-500">{g.mouSection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* WIOA Compliance Dashboard */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <WIOAComplianceDashboard />
        </div>
      </section>

      {/* Blockchain Credential Verification */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <ComplianceClientShell />
        </div>
      </section>
    </div>
  );
}
