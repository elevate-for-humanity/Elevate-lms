'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export async function createIncentive(formData: FormData) {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    type: formData.get('type') as string,
    value: parseFloat(formData.get('value') as string) || 0,
    eligibility_criteria: formData.get('eligibility_criteria') as string,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
    is_active: true,
  };

  const { error } = await supabase.from('incentives').insert(data);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
