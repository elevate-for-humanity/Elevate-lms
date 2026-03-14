import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import CredentialForm from '../CredentialForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'New Credential | Admin' };

export default async function NewCredentialPage() {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin','super_admin','org_admin','staff'].includes(profile.role)) redirect('/unauthorized');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Credential Registry', href: '/admin/credentials' },
          { label: 'New Credential' },
        ]} />
        <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-8">Add Credential</h1>
        <CredentialForm mode="create" />
      </div>
    </div>
  );
}
