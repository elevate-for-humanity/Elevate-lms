'use server';

import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function listContractTemplates() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('contract_templates')
    .select('id,title,agency_name,source_type,file_name,file_type,file_size,status,created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error('Contract templates could not load.');
  return data ?? [];
}
