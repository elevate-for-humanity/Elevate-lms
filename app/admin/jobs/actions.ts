'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: _profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!_profile || !['admin', 'super_admin'].includes(_profile.role)) throw new Error('Forbidden');

  const { error } = await db.from('jobs').insert({
    title: formData.get('title') as string,
    company: formData.get('company') as string,
    location: formData.get('location') as string,
    type: formData.get('type') as string,
    salary_min: formData.get('salary_min') ? parseFloat(formData.get('salary_min') as string) : null,
    salary_max: formData.get('salary_max') ? parseFloat(formData.get('salary_max') as string) : null,
    description: formData.get('description') as string,
    requirements: formData.get('requirements') as string,
    status: 'active',
    created_by: user.id,
  });

  if (error) throw new Error('Failed to process job action.');

  await logAdminAudit({ action: AdminAction.JOB_CREATED, actorId: user.id, entityType: 'jobs', entityId: BULK_ENTITY_ID, metadata: { title: formData.get('title') as string } });

  revalidatePath('/admin/jobs');
  redirect('/admin/jobs');
}
