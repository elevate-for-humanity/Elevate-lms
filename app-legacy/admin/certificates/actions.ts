'use server';

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';

export async function issueCertificate(formData: FormData) {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  const data = {
    recipient_name: formData.get('recipient_name') as string,
    recipient_email: formData.get('recipient_email') as string,
    template_id: formData.get('template_id') as string,
    program_id: formData.get('program_id') as string,
    issue_date: new Date().toISOString(),
    expiry_date: formData.get('expiry_date') as string || null,
    status: 'active',
  };

  const { error } = await supabase.from('certificates').insert(data);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
