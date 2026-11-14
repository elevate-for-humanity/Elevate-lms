'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
import { auditedMutation } from '@/lib/audit/transactional';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function createCommunicationTemplate(formData: FormData) {
  const auth = await requireRole(['admin', 'super_admin']);
  const key = String(formData.get('key') || '').trim().toLowerCase();
  const subject = String(formData.get('subject') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const html = String(formData.get('html') || '').trim();

  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/.test(key)) {
    redirect('/communications/templates/new?error=invalid-key');
  }
  if (!subject || !body) redirect('/communications/templates/new?error=missing-content');

  const db = await requireAdminClient();
  const tenantId = auth.profile.tenant_id || null;
  let duplicate = db.from('email_templates').select('id').eq('key', key);
  duplicate = tenantId ? duplicate.eq('tenant_id', tenantId) : duplicate.is('tenant_id', null);
  const { data: existing } = await duplicate.maybeSingle();
  if (existing) redirect('/communications/templates/new?error=duplicate-key');

  const { error } = await auditedMutation({
    table: 'email_templates',
    operation: 'insert',
    rowData: { tenant_id: tenantId, key, subject, body, html: html || body },
    audit: {
      action: 'admin:communications:template:create',
      actorId: auth.user.id,
      targetType: 'email_templates',
      metadata: { key, tenant_id: tenantId },
    },
  });
  if (error) redirect('/communications/templates/new?error=create-failed');

  revalidatePath('/communications/templates');
  redirect('/communications/templates?created=true');
}
