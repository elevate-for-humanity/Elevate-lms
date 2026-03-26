import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ProgramSubmitForm from './ProgramSubmitForm';

export const dynamic = 'force-dynamic';

export default async function ProviderProgramNewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/provider/programs/new');

  const db = createAdminClient()!;
  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single();
  if (!profile?.tenant_id) redirect('/unauthorized');

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Submit a Program</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Programs are reviewed by Elevate staff before being published in the catalog.
        </p>
      </div>
      <ProgramSubmitForm tenantId={profile.tenant_id} />
    </div>
  );
}
