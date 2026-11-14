import { createClient } from '@/lib/supabase/server';

export async function listClients(firmId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from('tax_clients')
    .select('id, firm_id, first_name, last_name, email, phone, ssn_last4, created_at')
    .order('last_name', { ascending: true });

  if (firmId) query = query.eq('firm_id', firmId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getClientById(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_clients')
    .select('id, firm_id, first_name, last_name, email, phone, ssn_last4, dob, created_at')
    .eq('id', clientId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createClient_(input: {
  firmId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  ssnHash?: string;
  ssnLast4?: string;
  dob?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_clients')
    .insert({
      firm_id: input.firmId ?? null,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      ssn_hash: input.ssnHash ?? null,
      ssn_last4: input.ssnLast4 ?? null,
      dob: input.dob ?? null,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}
