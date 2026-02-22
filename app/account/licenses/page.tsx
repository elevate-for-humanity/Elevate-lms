import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Key, Calendar, AlertCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Licenses | Elevate For Humanity',
  description: 'View and manage your software licenses.',
};

export default async function AccountLicensesPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/licenses');
  }

  // Fetch user's licenses
  const { data: licenses } = await db
    .from('user_licenses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Account', href: '/account' }, { label: 'Licenses' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Licenses</h1>

        {!licenses || licenses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Licenses Yet</h2>
            <p className="text-gray-600 mb-6">
              You don&apos;t have any active licenses. Browse our store to get started.
            </p>
            <Link
              href="/store/licenses"
              className="inline-block px-6 py-3 bg-brand-blue-600 text-white font-semibold rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Browse Licenses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {licenses.map((license: any) => (
              <div
                key={license.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {license.license_type || 'Platform License'}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      License Key: <code className="bg-gray-100 px-2 py-1 rounded">{license.license_key}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {license.status === 'active' ? (
                      <span className="flex items-center gap-1 text-brand-green-600 text-sm">
                        <span className="text-slate-400 flex-shrink-0">•</span>
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-brand-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {license.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Expires: {license.expires_at ? new Date(license.expires_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
