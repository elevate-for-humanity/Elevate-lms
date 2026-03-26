import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Settings | Admin',
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Settings' },
        ]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 text-sm mt-1">
            Changes are saved to the database and take effect immediately.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SettingsForm />
        </div>
      </div>
    </div>
  );
}
