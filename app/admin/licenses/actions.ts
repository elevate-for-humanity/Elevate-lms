'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export async function createLicense(formData: FormData) {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const data = {
    student_id: formData.get('student_id') as string,
    license_type: formData.get('license_type') as string,
    license_number: formData.get('license_number') as string,
    issue_date: formData.get('issue_date') as string,
    expiry_date: formData.get('expiry_date') as string,
    state: formData.get('state') as string,
  };

  const { error } = await supabase.from('licenses').insert(data);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
