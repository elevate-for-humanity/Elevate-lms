import Image from 'next/image';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, Award, Calendar, Building, Save } from 'lucide-react';
import { createLicense } from '../actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create License | Admin',
  description: 'Issue a new platform license.',
  robots: { index: false, follow: false },
};

export default async function CreateLicensePage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const tenants = db
    ? (await db.from('tenants').select('id, name').order('name')).data ?? []
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/programs-hero.jpg" alt="Store administration" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Licenses', href: '/admin/licenses' },
            { label: 'Create License' },
          ]} />
        </div>

        <Link href="/admin/licenses" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Licenses
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create License</h1>

        <form action={createLicense} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> Tenant</span>
            </label>
            {tenants.length > 0 ? (
              <select name="tenant_id" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="">Select tenant...</option>
                {tenants.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            ) : (
              <input name="tenant_id" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Tenant UUID" />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Tier</span>
              </label>
              <select name="tier" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="free">Free</option>
                <option value="standard">Standard</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Expires At</span>
              </label>
              <input name="expires_at" type="date" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/licenses" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</Link>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <Save className="w-4 h-4" /> Create License
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
