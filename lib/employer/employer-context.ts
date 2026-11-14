import type { SupabaseClient } from '@supabase/supabase-js';

export interface EmployerRecord {
  id: string;
  owner_user_id: string | null;
  business_name: string | null;
  company_name: string | null;
  company_size: string | null;
  industry: string | null;
  website_url: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  approved: boolean | null;
  accepts_ojt: boolean | null;
  accepts_apprentices: boolean | null;
  wotc_participant: boolean | null;
  verified_at: string | null;
}

const EMPLOYER_SELECT = [
  'id',
  'owner_user_id',
  'business_name',
  'company_name',
  'company_size',
  'industry',
  'website_url',
  'description',
  'city',
  'state',
  'zip',
  'phone',
  'approved',
  'accepts_ojt',
  'accepts_apprentices',
  'wotc_participant',
  'verified_at',
].join(',');

/**
 * Resolve an authenticated account to its canonical public.employers row.
 * Downstream employer-owned tables use employers.id, never auth.users.id.
 */
export async function getEmployerRecord(
  supabase: SupabaseClient,
  userId: string,
): Promise<EmployerRecord | null> {
  const { data, error } = await supabase
    .from('employers')
    .select(EMPLOYER_SELECT)
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to resolve employer account: ${error.message}`);
  }

  return (data as unknown as EmployerRecord | null) ?? null;
}
