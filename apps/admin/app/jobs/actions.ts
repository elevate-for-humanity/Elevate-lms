'use server';

import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

async function saveJob(form: FormData, id?: string) {
  const { user } = await requireRole(['admin']);
  const db = await requireAdminClient();
  const value = (key: string) => String(form.get(key) ?? '').trim();
  const title = value('title');
  const description = value('description');
  const location = value('location');
  const employerId = value('employer_id');
  const employmentType = value('employment_type');
  const status = value('status') || 'pending';
  if (title.length < 3 || title.length > 160 || description.length < 20 || !location) {
    throw new Error('Enter a title, location, and description of at least 20 characters.');
  }
  if (!['Full-time', 'Part-time', 'Apprenticeship', 'Internship', 'Contract'].includes(employmentType)) throw new Error('Invalid employment type.');
  if (!['pending', 'active', 'paused', 'closed'].includes(status)) throw new Error('Invalid posting status.');
  const { data: employer, error: employerError } = await db.from('employers')
    .select('id,approved').eq('id', employerId).maybeSingle();
  if (employerError || !employer) throw new Error('Select an existing employer.');
  if (status === 'active' && !employer.approved) throw new Error('Approve the employer before publishing its job.');
  const payload = {
    employer_id: employer.id, title, job_title: title, description, job_description: description,
    location, employment_type: employmentType, job_type: employmentType,
    requirements: value('requirements') || null, salary_range: value('salary_range') || null,
    status, approved_at: status === 'active' ? new Date().toISOString() : null,
    approved_by: status === 'active' ? user.id : null,
  };
  const result = id
    ? await db.from('job_postings').update(payload).eq('id', id).select('id').maybeSingle()
    : await db.from('job_postings').insert({ ...payload, posted_by: user.id }).select('id').single();
  if (result.error || !result.data) throw new Error('Unable to save this job posting.');
  await logAdminAudit({
    action: id ? AdminAction.JOB_UPDATED : AdminAction.JOB_CREATED,
    actorId: user.id, entityType: 'job_postings', entityId: result.data.id,
    metadata: { title, status, employer_id: employer.id },
  });
  for (const path of ['/jobs', `/jobs/${result.data.id}`]) revalidatePath(path);
  redirect(`/jobs/${result.data.id}`);
}

export async function createJob(form: FormData) { return saveJob(form); }
export async function updateJob(id: string, form: FormData) { return saveJob(form, id); }
