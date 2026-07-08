import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function getAccountOrganizationId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.tenant_id ?? null;
}

export async function requireAccountOrganizationId(): Promise<string> {
  const orgId = await getAccountOrganizationId();
  if (!orgId) {
    redirect('/store/trial?redirect=/account/plan');
  }
  return orgId;
}
