'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';

export async function updateEmployerPosting(postingId: string, form: FormData) {
  const { user } = await requireRole(['employer', 'sponsor', 'admin', 'super_admin']);
  const db = await createClient();
  const employer = await getEmployerRecord(db, user.id);
  if (!employer?.approved) throw new Error('An approved employer account is required.');
  const value = (key: string) => String(form.get(key) ?? '').trim();
  const title = value('title');
  const description = value('description');
  const location = value('location');
  const status = value('status');
  if (title.length < 3 || title.length > 160 || description.length < 20 || !location) {
    throw new Error('Enter a job title, location, and description of at least 20 characters.');
  }
  if (!['pending', 'paused', 'closed'].includes(status)) throw new Error('Invalid posting status.');
  const { data, error } = await db.from('job_postings').update({
    title, description, job_title: title, job_description: description, location, status,
    // Changed listings return to review before publication.
    approved_at: null, approved_by: null,
  }).eq('id', postingId).eq('employer_id', employer.id).select('id').maybeSingle();
  if (error) throw new Error('Unable to save this posting.');
  if (!data) throw new Error('Posting not found in your employer account.');
  for (const path of ['/employer/jobs', '/employer/postings', `/employer/postings/${postingId}`]) revalidatePath(path);
  redirect(`/employer/postings/${postingId}`);
}
