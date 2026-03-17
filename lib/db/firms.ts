import { createClient } from '@/lib/supabase/server';

export async function listFirms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_firms')
    .select('id, name, ein, phone, created_at')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFirmById(firmId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_firms')
    .select('*')
    .eq('id', firmId)
    .single();

  if (error) throw error;
  return data;
}

export async function createFirm(input: {
  name: string;
  ein?: string;
  phone?: string;
  address?: Record<string, string>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tax_firms')
    .insert({
      name: input.name,
      ein: input.ein ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
