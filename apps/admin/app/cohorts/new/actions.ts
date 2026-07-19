'use server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function createCohort(formData: FormData) {
  const h = await headers();
  const req = new Request('http://localhost', { headers: h });
  const auth = await apiRequireAdmin(req);
  if (auth.error) throw new Error('Unauthorized');

  const db = await requireAdminClient();
  if (!db) throw new Error('DB unavailable');

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const program_id = formData.get('program_id') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = (formData.get('end_date') as string) || null;
  const max_capacity = parseInt(formData.get('max_capacity') as string, 10) || 20;
  const location = (formData.get('location') as string) || null;
  const status = (formData.get('status') as string) || 'planned';
  const notes = (formData.get('notes') as string) || null;

  if (!name || !code || !program_id || !start_date) {
    throw new Error('Name, code, program, and start date are required');
  }

  const { data, error } = await db
    .from('cohorts')
    .insert({
      name,
      code,
      program_id,
      start_date,
      end_date,
      max_capacity,
      location,
      status,
      notes,
      current_enrollment: 0,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/admin/cohorts');
  redirect(`/admin/cohorts`);
}
