import { requireRole } from '@/lib/auth/require-role';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { ApiKeysClient } from './ApiKeysClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'API Keys | Admin | Elevate For Humanity',
  description: 'Manage API keys for integrations.',
};

export default async function AdminApiKeysPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await createClient();

  const { data: apiKeys } = await supabase
    .from('api_keys')
    .select('id, name, is_active, created_at, last_used_at')
    .order('created_at', { ascending: false });

  const { count: totalKeys } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true });

  const { count: activeKeys } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'API Keys' }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ApiKeysClient
          apiKeys={apiKeys ?? []}
          totalKeys={totalKeys ?? 0}
          activeKeys={activeKeys ?? 0}
        />
      </div>
    </div>
  );
}
