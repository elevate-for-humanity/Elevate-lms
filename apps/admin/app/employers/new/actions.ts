'use server';
import { requireRole } from '@/lib/auth/require-role';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function createEmployer(formData: FormData) {
  const { user } = await requireRole(['admin', 'staff']);
  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('EMPLOYER_NAME_REQUIRED');
  const db = await requireAdminClient();
  const { data, error } = await db.from('employers').insert({
    name, business_name: name, company_name: name,
    industry: (formData.get('industry') as string) || null,
    city: (formData.get('city') as string) || null,
    state: (formData.get('state') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    status: 'pending', approved: false,
  }).select('id').single();
  if (error || !data) throw new Error('EMPLOYER_CREATE_FAILED');
  await logAdminAudit({ action: AdminAction.EMPLOYER_CREATED, actorId: user.id, entityType: 'employers', entityId: data.id, metadata: { business_name: name } });
  redirect(`/employers/${data.id}`);
}

